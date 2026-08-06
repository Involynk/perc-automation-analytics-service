import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import {
  LeadCapturedEvent,
  ResponseEvent,
  MeetingScheduledEvent,
  MeetingCompletedEvent,
  MeetingMissedEvent,
  MeetingCancelledEvent,
  MeetingRescheduledEvent,
  MessageSentEvent,
} from '@perc/shared';
import { AnalyticsService } from '../analytics.service';

@Injectable()
export class AnalyticsListener {
  private readonly logger = new Logger(AnalyticsListener.name);

  constructor(
    private supabase: SupabaseClient,
    private analyticsService: AnalyticsService,
  ) {}

  @OnEvent('lead.captured')
  async onLeadCaptured(event: LeadCapturedEvent): Promise<void> {
    const now = new Date().toISOString();
    await this.analyticsService.record('lead.created', event.leadId, event.source, {
      source: event.source,
      categories: event.categories,
      trigger_event: event.triggerEvent,
      created_at: now,
    });

    await this.supabase.from('timeline_events').insert({
      id: crypto.randomUUID(),
      lead_id: event.leadId,
      event_type_id: 'evt_analytics_updated',
      actor_type: 'automation',
      description: `Analytics updated: lead.created (${event.source})`,
      metadata: JSON.stringify({ metric: 'lead.created', source: event.source }),
    });
  }

  @OnEvent('response.triggered')
  async onResponseTriggered(event: ResponseEvent): Promise<void> {
    const leadId = event.target.entity_id;
    const leadCreatedAt = await this.getLeadCreatedAt(leadId);
    const now = Date.now();
    const responseTimeMs = leadCreatedAt ? now - new Date(leadCreatedAt).getTime() : null;

    await this.analyticsService.record('response.sent', leadId, event.source_channel, {
      trigger_event: event.trigger_event,
      channel: event.target.preferred_channel,
      response_time_ms: responseTimeMs,
      sent_at: new Date(now).toISOString(),
    });
  }

  @OnEvent('meeting.scheduled')
  async onMeetingScheduled(event: MeetingScheduledEvent): Promise<void> {
    await this.analyticsService.record('meeting.scheduled', event.leadId, null, {
      meeting_id: event.meetingId,
      meeting_type: event.meetingType,
      scheduled_at: event.scheduledAt,
    });
  }

  @OnEvent('meeting.rescheduled')
  async onMeetingRescheduled(event: MeetingRescheduledEvent): Promise<void> {
    await this.analyticsService.record('meeting.rescheduled', event.leadId, null, {
      meeting_id: event.meetingId,
      scheduled_at: event.newScheduledAt,
    });
  }

  @OnEvent('meeting.completed')
  async onMeetingCompleted(event: MeetingCompletedEvent): Promise<void> {
    await this.analyticsService.record('meeting.completed', event.leadId, null, {
      meeting_id: event.meetingId,
    });
  }

  @OnEvent('meeting.missed')
  async onMeetingMissed(event: MeetingMissedEvent): Promise<void> {
    await this.analyticsService.record('meeting.missed', event.leadId, null, {
      meeting_id: event.meetingId,
    });
  }

  @OnEvent('meeting.cancelled')
  async onMeetingCancelled(event: MeetingCancelledEvent): Promise<void> {
    await this.analyticsService.record('meeting.cancelled', event.leadId, null, {
      meeting_id: event.meetingId,
    });
  }

  @OnEvent('message.sent')
  async onMessageSent(event: MessageSentEvent): Promise<void> {
    await this.analyticsService.record('message.sent', event.leadId, event.channel, {
      channel: event.channel,
      conversation_id: event.conversationId,
    });
  }

  private async getLeadCreatedAt(leadId: string): Promise<string | null> {
    try {
      const { data } = await this.supabase.from('leads').select('created_at').eq('id', leadId).maybeSingle();
      return data?.created_at || null;
    } catch {
      return null;
    }
  }
}
