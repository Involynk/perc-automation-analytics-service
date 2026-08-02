import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  ChannelName,
  TWO_WAY_CHANNELS,
  ResponseEvent,
  TRIGGER_SOURCE_LEAD_CAPTURE,
  TRIGGER_MEETING_REQUESTED,
  TRIGGER_MEETING_CONFIRMED,
  TRIGGER_MEETING_REMINDER,
  TRIGGER_MEETING_MISSED,
  TRIGGER_MEETING_RESCHEDULED,
  TRIGGER_MEETING_CANCELLED,
  TRIGGER_MEETING_COMPLETED,
  TRIGGER_MEETING_FEEDBACK_REQUEST,
  MeetingSlot,
  MeetingScheduledEvent,
  MeetingCompletedEvent,
  MeetingMissedEvent,
  MeetingRescheduledEvent,
  MeetingCancelledEvent,
  MeetingFeedbackRequestedEvent,
} from '@perc/shared';
import { WorkflowClient } from './clients';
import * as crypto from 'crypto';

interface CalendarSettings {
  start: string;
  end: string;
  timezone: string;
}

interface MeetingIntent {
  meetingType: string;
  rawUserMessage?: string;
}

@Injectable()
export class MeetingService {
  private readonly logger = new Logger(MeetingService.name);

  constructor(
    private supabase: SupabaseClient,
    private workflowClient: WorkflowClient,
    private eventEmitter: EventEmitter2,
  ) {}

  // ── Intent entry point (consumed from lead.captured) ──
  async handleMeetingRequest(leadId: string, source: string, intent: MeetingIntent): Promise<void> {
    const { data: lead } = await this.supabase.from('leads').select('*').eq('id', leadId).single();
    if (!lead) return;

    const organizerId = lead.assigned_to || (await this.findDefaultOrganizer());
    const slots = await this.findAvailableSlots(organizerId, 3);

    if (slots.length === 0) {
      this.logger.warn(`No available slots for lead ${leadId}`);
      await this.emitResponse(lead, source, TRIGGER_MEETING_REQUESTED, {
        meeting_type: intent.meetingType,
        slot_options: 'tomorrow morning',
      });
      return;
    }

    await this.supabase.from('meetings').insert({
      id: crypto.randomUUID(),
      lead_id: leadId,
      organizer_id: organizerId,
      meeting_type: intent.meetingType,
      status: 'scheduled',
      scheduled_at: null,
      duration_minutes: 30,
      metadata: '{}',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await this.supabase.from('timeline_events').insert({
      id: crypto.randomUUID(),
      lead_id: leadId,
      event_type_id: 'evt_meeting_requested',
      actor_type: 'automation',
      description: `${lead.first_name} requested a ${intent.meetingType}`,
      metadata: JSON.stringify({ meeting_type: intent.meetingType, slots }),
    });

    await this.emitResponse(lead, source, TRIGGER_MEETING_REQUESTED, {
      meeting_type: intent.meetingType,
      slot_options: this.formatSlotOptions(slots),
      meeting_slots: slots,
    });
  }

  // ── Availability ──
  async findAvailableSlots(organizerId: string | null, count: number): Promise<MeetingSlot[]> {
    const settings = await this.loadCalendarSettings();
    const duration = Number(settings.durationMinutes) || 30;
    const buffer = Number(settings.bufferMinutes) || 15;

    const { data: existing } = await this.supabase
      .from('meetings')
      .select('scheduled_at, duration_minutes')
      .eq('status', 'scheduled')
      .not('scheduled_at', 'is', null);

    const busy: Array<{ start: number; end: number }> = (existing || [])
      .filter((m: any) => !organizerId || !m.organizer_id || m.organizer_id === organizerId)
      .map((m: any) => ({
        start: new Date(m.scheduled_at).getTime(),
        end: new Date(m.scheduled_at).getTime() + (m.duration_minutes || duration) * 60000,
      }));

    const slots: MeetingSlot[] = [];
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    for (let day = 0; day < 7 && slots.length < count; day++) {
      const cursor = new Date(startOfDay.getTime() + day * 86400000);
      if (cursor.getDay() === 0) continue;

      const slotStart = new Date(cursor);
      slotStart.setHours(parseInt(settings.start.split(':')[0]), parseInt(settings.start.split(':')[1] || '0'), 0, 0);
      const slotEndBoundary = new Date(cursor);
      slotEndBoundary.setHours(parseInt(settings.end.split(':')[0]), parseInt(settings.end.split(':')[1] || '0'), 0, 0);

      while (slotStart.getTime() + duration * 60000 <= slotEndBoundary.getTime() && slots.length < count) {
        const startTs = slotStart.getTime();
        const endTs = startTs + duration * 60000;
        const startTz = new Date(startTs + buffer * 60000);
        const endTz = new Date(endTs + buffer * 60000);

        const isBusy = busy.some((b) => startTz.getTime() < b.end && endTz.getTime() > b.start);
        const isPast = startTz.getTime() < now;

        if (!isBusy && !isPast) {
          slots.push({
            start: new Date(startTz).toISOString(),
            end: new Date(endTz).toISOString(),
            label: this.formatSlotLabel(new Date(startTz)),
          });
        }

        slotStart.setMinutes(slotStart.getMinutes() + duration + buffer);
      }
    }

    return slots;
  }

  // ── Booking ──
  async bookMeeting(
    leadId: string,
    scheduledAt: string,
    meetingType: string,
    organizerId?: string,
  ): Promise<{ meetingId: string; leadId: string }> {
    const { data: lead } = await this.supabase.from('leads').select('*').eq('id', leadId).single();
    if (!lead) throw new Error('Lead not found');

    const meetingId = crypto.randomUUID();
    const orgId = organizerId || lead.assigned_to || (await this.findDefaultOrganizer());

    await this.supabase.from('meetings').insert({
      id: meetingId,
      lead_id: leadId,
      organizer_id: orgId,
      meeting_type: meetingType,
      status: 'scheduled',
      scheduled_at: scheduledAt,
      duration_minutes: 30,
      metadata: '{}',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await this.updateLeadStatus(lead, meetingType === 'demo' ? 'demo_scheduled' : 'call_scheduled');

    await this.supabase.from('timeline_events').insert({
      id: crypto.randomUUID(),
      lead_id: leadId,
      event_type_id: 'evt_meeting_scheduled',
      actor_type: 'automation',
      description: `${meetingType} booked for ${new Date(scheduledAt).toISOString()}`,
      metadata: JSON.stringify({ meeting_id: meetingId, scheduled_at: scheduledAt }),
    });

    await this.scheduleMeetingReminder(leadId, meetingId, scheduledAt);
    await this.scheduleFollowUpPromise(leadId, meetingId);

    this.eventEmitter.emit(
      'meeting.scheduled',
      new MeetingScheduledEvent(meetingId, leadId, scheduledAt, meetingType, orgId),
    );

    await this.emitResponse(lead, lead.source, TRIGGER_MEETING_CONFIRMED, {
      meeting_id: meetingId,
      meeting_type: meetingType,
      meeting_time: this.formatDateTime(new Date(scheduledAt)),
      counselor_name: await this.findOrganizerName(orgId),
    });

    return { meetingId, leadId };
  }

  // ── Reschedule ──
  async rescheduleMeeting(meetingId: string, newScheduledAt: string): Promise<void> {
    const { data: meeting } = await this.supabase.from('meetings').select('*').eq('id', meetingId).single();
    if (!meeting) throw new Error('Meeting not found');

    await this.supabase.from('meetings').update({
      scheduled_at: newScheduledAt,
      updated_at: new Date().toISOString(),
    }).eq('id', meetingId);

    await this.supabase.from('timeline_events').insert({
      id: crypto.randomUUID(),
      lead_id: meeting.lead_id,
      event_type_id: 'evt_meeting_rescheduled',
      actor_type: 'automation',
      description: `Meeting rescheduled to ${new Date(newScheduledAt).toISOString()}`,
      metadata: JSON.stringify({ meeting_id: meetingId }),
    });

    await this.scheduleMeetingReminder(meeting.lead_id, meetingId, newScheduledAt);

    this.eventEmitter.emit(
      'meeting.rescheduled',
      new MeetingRescheduledEvent(meetingId, meeting.lead_id, newScheduledAt),
    );

    const { data: lead } = await this.supabase.from('leads').select('*').eq('id', meeting.lead_id).single();
    if (lead) {
      await this.emitResponse(lead, lead.source, TRIGGER_MEETING_RESCHEDULED, {
        meeting_id: meetingId,
        meeting_type: meeting.meeting_type,
        meeting_time: this.formatDateTime(new Date(newScheduledAt)),
      });
    }
  }

  // ── Cancel ──
  async cancelMeeting(meetingId: string, reason?: string): Promise<void> {
    const { data: meeting } = await this.supabase.from('meetings').select('*').eq('id', meetingId).single();
    if (!meeting) throw new Error('Meeting not found');

    await this.supabase.from('meetings').update({
      status: 'cancelled',
      cancellation_reason: reason || null,
      updated_at: new Date().toISOString(),
    }).eq('id', meetingId);

    await this.supabase.from('timeline_events').insert({
      id: crypto.randomUUID(),
      lead_id: meeting.lead_id,
      event_type_id: 'evt_meeting_cancelled',
      actor_type: 'automation',
      description: `Meeting cancelled${reason ? `: ${reason}` : ''}`,
      metadata: JSON.stringify({ meeting_id: meetingId }),
    });

    this.eventEmitter.emit('meeting.cancelled', new MeetingCancelledEvent(meetingId, meeting.lead_id));

    const { data: lead } = await this.supabase.from('leads').select('*').eq('id', meeting.lead_id).single();
    if (lead) {
      await this.emitResponse(lead, lead.source, TRIGGER_MEETING_CANCELLED, {
        meeting_id: meetingId,
        meeting_type: meeting.meeting_type,
      });
    }
  }

  // ── Complete ──
  async completeMeeting(meetingId: string): Promise<void> {
    const { data: meeting } = await this.supabase.from('meetings').select('*').eq('id', meetingId).single();
    if (!meeting) throw new Error('Meeting not found');

    await this.supabase.from('meetings').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', meetingId);

    await this.updateLeadStatus(meeting.lead_id, 'meeting_completed');

    await this.supabase.from('timeline_events').insert({
      id: crypto.randomUUID(),
      lead_id: meeting.lead_id,
      event_type_id: 'evt_meeting_completed',
      actor_type: 'automation',
      description: 'Meeting completed',
      metadata: JSON.stringify({ meeting_id: meetingId }),
    });

    this.eventEmitter.emit('meeting.completed', new MeetingCompletedEvent(meetingId, meeting.lead_id));

    await this.scheduleFeedbackPromise(meeting.lead_id, meetingId);

    const { data: lead } = await this.supabase.from('leads').select('*').eq('id', meeting.lead_id).single();
    if (lead) {
      await this.emitResponse(lead, lead.source, TRIGGER_MEETING_COMPLETED, {
        meeting_id: meetingId,
        meeting_type: meeting.meeting_type,
      });
    }
  }

  // ── Missed ──
  async markMissed(meetingId: string): Promise<void> {
    const { data: meeting } = await this.supabase.from('meetings').select('*').eq('id', meetingId).single();
    if (!meeting) throw new Error('Meeting not found');

    await this.supabase.from('meetings').update({
      status: 'missed',
      updated_at: new Date().toISOString(),
    }).eq('id', meetingId);

    await this.supabase.from('timeline_events').insert({
      id: crypto.randomUUID(),
      lead_id: meeting.lead_id,
      event_type_id: 'evt_meeting_missed',
      actor_type: 'automation',
      description: 'Meeting missed — offering rebooking slots',
      metadata: JSON.stringify({ meeting_id: meetingId }),
    });

    this.eventEmitter.emit('meeting.missed', new MeetingMissedEvent(meetingId, meeting.lead_id));

    const organizerId = meeting.organizer_id || (await this.findDefaultOrganizer());
    const slots = await this.findAvailableSlots(organizerId, 3);

    const { data: lead } = await this.supabase.from('leads').select('*').eq('id', meeting.lead_id).single();
    if (lead) {
      await this.emitResponse(lead, lead.source, TRIGGER_MEETING_MISSED, {
        meeting_id: meetingId,
        meeting_type: meeting.meeting_type,
        slot_options: this.formatSlotOptions(slots),
        meeting_slots: slots,
      });
    }
  }

  // ── Feedback ──
  async requestFeedback(meetingId: string): Promise<void> {
    const { data: meeting } = await this.supabase.from('meetings').select('*').eq('id', meetingId).single();
    if (!meeting) throw new Error('Meeting not found');

    this.eventEmitter.emit(
      'meeting.feedback_requested',
      new MeetingFeedbackRequestedEvent(meetingId, meeting.lead_id),
    );

    const { data: lead } = await this.supabase.from('leads').select('*').eq('id', meeting.lead_id).single();
    if (lead) {
      await this.emitResponse(lead, lead.source, TRIGGER_MEETING_FEEDBACK_REQUEST, {
        meeting_id: meetingId,
        meeting_type: meeting.meeting_type,
      });
    }
  }

  async sendReminderMessage(meeting: any, lead: any): Promise<void> {
    await this.emitResponse(lead, lead.source, TRIGGER_MEETING_REMINDER, {
      meeting_id: meeting.id,
      meeting_type: meeting.meeting_type,
      meeting_time: this.formatDateTime(new Date(meeting.scheduled_at)),
      counselor_name: await this.findOrganizerName(meeting.organizer_id),
    });
  }

  async collectFeedback(meetingId: string, rating: number, feedback?: string): Promise<void> {
    const { data: meeting } = await this.supabase.from('meetings').select('*').eq('id', meetingId).single();
    if (!meeting) throw new Error('Meeting not found');

    await this.supabase.from('meetings').update({
      feedback_rating: rating,
      feedback: feedback || null,
      updated_at: new Date().toISOString(),
    }).eq('id', meetingId);

    await this.supabase.from('timeline_events').insert({
      id: crypto.randomUUID(),
      lead_id: meeting.lead_id,
      event_type_id: 'evt_meeting_feedback',
      actor_type: 'lead',
      description: `Feedback received: ${rating}/5${feedback ? ` — ${feedback}` : ''}`,
      metadata: JSON.stringify({ meeting_id: meetingId, rating }),
    });
  }

  // ── Response emission (Golden Rule: Brain declares, never composes) ──
  private async emitResponse(
    lead: any,
    sourceChannel: string,
    triggerEvent: string,
    extraContext: Record<string, any>,
  ): Promise<void> {
    const destination: Record<string, string> = {};
    let preferredChannel = sourceChannel;

    if (lead.phone && lead.phone.startsWith('+')) {
      destination[ChannelName.WHATSAPP] = lead.phone;
      preferredChannel = ChannelName.WHATSAPP;
    } else if (TWO_WAY_CHANNELS.includes(sourceChannel)) {
      destination[sourceChannel] = lead.source_reference_id || '';
    }

    if (lead.email) destination[ChannelName.EMAIL] = lead.email;

    const event = new ResponseEvent(
      `evt_${crypto.randomUUID()}`,
      triggerEvent,
      TRIGGER_SOURCE_LEAD_CAPTURE,
      lead.source,
      {
        entity_type: 'Lead',
        entity_id: lead.id,
        destination,
        preferred_channel: preferredChannel,
        language_preference: 'en',
      },
      {
        lead_name: lead.first_name,
        raw_user_message: extraContext.raw_user_message || '',
        counselor_id: lead.assigned_to || undefined,
        ...extraContext,
      },
    );

    await this.eventEmitter.emitAsync('response.triggered', event);
  }

  // ── Promises (Engine 4 wiring) ──
  private async scheduleMeetingReminder(leadId: string, meetingId: string, scheduledAt: string): Promise<void> {
    const reminderAt = new Date(new Date(scheduledAt).getTime() - 60 * 60 * 1000).toISOString();
    const result = await this.workflowClient.createPromise({
      lead_id: leadId,
      promise_type: 'meeting_reminder',
      scheduled_at: reminderAt,
      payload: { action: 'send_meeting_reminder', meeting_id: meetingId },
    });
    if (!result.success) this.logger.warn(`Failed to schedule meeting reminder for ${meetingId}`);
  }

  private async scheduleFeedbackPromise(leadId: string, meetingId: string): Promise<void> {
    const result = await this.workflowClient.createPromise({
      lead_id: leadId,
      promise_type: 'feedback',
      scheduled_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      payload: { action: 'request_meeting_feedback', meeting_id: meetingId },
    });
    if (!result.success) this.logger.warn(`Failed to schedule feedback promise for ${meetingId}`);
  }

  private async scheduleFollowUpPromise(leadId: string, meetingId: string): Promise<void> {
    const result = await this.workflowClient.createPromise({
      lead_id: leadId,
      promise_type: 'followup',
      scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      payload: { action: 'check_after_meeting', meeting_id: meetingId, attempt: 1 },
    });
    if (!result.success) this.logger.warn(`Failed to schedule follow-up for ${meetingId}`);
  }

  // ── Helpers ──
  private async updateLeadStatus(lead: any, status: string): Promise<void> {
    await this.supabase.from('leads').update({ status, last_contacted_at: new Date().toISOString() }).eq('id', lead.id);
    await this.supabase.from('workflow_instances').update({ current_state: status }).eq('lead_id', lead.id);
  }

  private async loadCalendarSettings(): Promise<CalendarSettings & { durationMinutes?: string; bufferMinutes?: string }> {
    let settings: any = { start: '09:00', end: '18:00', timezone: 'Asia/Kolkata' };
    let durationMinutes = '30';
    let bufferMinutes = '15';

    try {
      const { data } = await this.supabase.from('settings').select('key, value').in('key', ['working_hours', 'default_meeting_duration', 'meeting_buffer_minutes']);
      if (data) {
        for (const row of data) {
          if (row.key === 'working_hours') settings = { ...settings, ...JSON.parse(row.value) };
          if (row.key === 'default_meeting_duration') durationMinutes = row.value;
          if (row.key === 'meeting_buffer_minutes') bufferMinutes = row.value;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to load calendar settings: ${err.message}`);
    }

    return { ...settings, durationMinutes, bufferMinutes };
  }

  private async findDefaultOrganizer(): Promise<string | null> {
    const { data } = await this.supabase
      .from('users')
      .select('id')
      .in('role', ['super_admin', 'admin', 'counselor'])
      .eq('is_active', true)
      .limit(1);
    return data?.[0]?.id || null;
  }

  private async findOrganizerName(organizerId: string | null): Promise<string> {
    if (!organizerId) return 'our team';
    try {
      const { data } = await this.supabase.from('users').select('name').eq('id', organizerId).maybeSingle();
      return data?.name || 'our team';
    } catch {
      return 'our team';
    }
  }

  private formatSlotOptions(slots: MeetingSlot[]): string {
    return slots.map((s, i) => `${i + 1}. ${s.label}`).join('\n');
  }

  private formatSlotLabel(d: Date): string {
    return d.toLocaleString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: 'numeric', minute: '2-digit',
    });
  }

  private formatDateTime(d: Date): string {
    return d.toLocaleString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: 'numeric', minute: '2-digit',
    });
  }
}
