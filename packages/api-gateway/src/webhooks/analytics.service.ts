import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const METRIC_EVENT_TYPES = ['lead.created', 'lead.updated', 'response.sent', 'meeting.scheduled', 'meeting.completed', 'meeting.missed', 'meeting.cancelled', 'message.sent', 'admission.completed'];

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private supabase: SupabaseClient) {}

  // ── Event-first writer: every domain event becomes an append-only analytics row ──
  async record(
    eventType: string,
    leadId: string | null,
    source: string | null,
    eventData: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      await this.supabase.from('analytics_events').insert({
        id: crypto.randomUUID(),
        lead_id: leadId,
        event_type: eventType,
        event_data: JSON.stringify(eventData),
        source,
        created_at: new Date().toISOString(),
      });
    } catch (err: any) {
      this.logger.warn(`Failed to record analytics event ${eventType}: ${err.message}`);
    }
  }

  // ── Read model: live aggregation from analytics_events + business tables ──
  async getOverview(): Promise<any> {
    const [events, leads, meetings, admissions, settings] = await Promise.all([
      this.fetchEvents(),
      this.supabase.from('leads').select('id, source, status, created_at'),
      this.supabase.from('meetings').select('status, meeting_type, feedback_rating'),
      this.supabase.from('admissions').select('id, status, fee_paid, total_fee'),
      this.loadSettings(),
    ]);

    const evtList = events || [];
    const leadList = leads?.data || [];
    const meetingList = meetings?.data || [];
    const admissionList = admissions?.data || [];

    const now = new Date();
    const todayKey = this.dateKey(now);
    const leadsToday = leadList.filter((l: any) => this.dateKey(new Date(l.created_at)) === todayKey).length;

    const responseMs = evtList
      .filter((e: any) => e.event_type === 'response.sent' && e.event_data)
      .map((e: any) => Number(JSON.parse(e.event_data).response_time_ms))
      .filter((n: number) => Number.isFinite(n) && n > 0);

    const avgResponseMs = responseMs.length
      ? Math.round(responseMs.reduce((a: number, b: number) => a + b, 0) / responseMs.length)
      : 0;

    const meetingsByStatus = this.countBy(meetingList, 'status');
    const meetingsByType = this.countBy(meetingList, 'meeting_type');

    const ratings = meetingList
      .map((m: any) => m.feedback_rating)
      .filter((r: number | null) => typeof r === 'number' && r > 0);
    const avgRating = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;

    const feePaidAdmissions = admissionList.filter((a: any) => a.status === 'completed' || a.fee_paid);
    const revenue =
      feePaidAdmissions.reduce(
        (sum: number, a: any) => sum + (Number(a.total_fee) || Number(settings.avgTicketValue) || 0),
        0,
      ) || 0;

    return {
      generated_at: now.toISOString(),
      total_leads: leadList.length,
      leads_today: leadsToday,
      target_daily_leads: Number(settings.targetDailyLeads) || 50,
      leads_by_status: this.countBy(leadList, 'status'),
      leads_by_source: this.countBy(leadList, 'source'),
      total_meetings: meetingList.length,
      meetings_by_status: meetingsByStatus,
      meetings_by_type: meetingsByType,
      meeting_completion_rate: meetingList.length
        ? Math.round((meetingsByStatus.completed || 0) / meetingList.length * 100)
        : 0,
      avg_response_time_ms: avgResponseMs,
      avg_feedback_rating: Math.round(avgRating * 10) / 10,
      admissions_completed: feePaidAdmissions.length,
      seat_target: Number(settings.seatTarget) || 150,
      revenue_estimated: Math.round(revenue),
      avg_ticket_value: Number(settings.avgTicketValue) || 0,
      conversion_rate: leadList.length
        ? Math.round(
            (leadList.filter((l: any) => l.status === 'meeting_completed').length / leadList.length) * 100,
          )
        : 0,
    };
  }

  async getLeads(by: string = 'source'): Promise<any> {
    const { data: leads } = await this.supabase
      .from('leads')
      .select('id, source, status, category, created_at');

    const rows = leads || [];
    let grouped: Record<string, number> = {};

    if (by === 'date') {
      grouped = this.countByDate(rows, 'created_at');
    } else if (by === 'status') {
      grouped = this.countBy(rows, 'status');
    } else {
      grouped = this.countBy(rows, 'source');
    }

    return { by, rows: Object.entries(grouped).map(([key, value]) => ({ key, value })) };
  }

  async getConversions(): Promise<any> {
    const [leadsRes, meetingsRes] = await Promise.all([
      this.supabase.from('leads').select('status'),
      this.supabase.from('meetings').select('status'),
    ]);
    const leads = leadsRes.data || [];
    const meetings = meetingsRes.data || [];

    const funnel = {
      new: leads.filter((l: any) => l.status === 'new').length,
      call_scheduled: leads.filter((l: any) => l.status === 'call_scheduled').length,
      demo_scheduled: leads.filter((l: any) => l.status === 'demo_scheduled').length,
      meeting_completed: leads.filter((l: any) => l.status === 'meeting_completed').length,
    };

    const toPct = (num: number, den: number) => (den ? Math.round((num / den) * 100) : 0);
    const contacted = funnel.call_scheduled + funnel.demo_scheduled + funnel.meeting_completed;

    return {
      total_leads: leads.length,
      funnel,
      enquiry_to_contacted: toPct(contacted, leads.length),
      enquiry_to_meeting_completed: toPct(funnel.meeting_completed, leads.length),
      meeting_show_rate: meetings.length
        ? toPct(meetings.filter((m: any) => m.status === 'completed').length, meetings.length)
        : 0,
      meeting_missed_rate: meetings.length
        ? toPct(meetings.filter((m: any) => m.status === 'missed').length, meetings.length)
        : 0,
    };
  }

  async getResponseTimes(): Promise<any> {
    const { data: events } = await this.supabase
      .from('analytics_events')
      .select('event_data, created_at')
      .eq('event_type', 'response.sent');

    const samples = (events || [])
      .map((e: any) => Number(JSON.parse(e.event_data || '{}').response_time_ms))
      .filter((n: number) => Number.isFinite(n) && n > 0)
      .sort((a: number, b: number) => a - b);

    const sum = samples.reduce((a: number, b: number) => a + b, 0);

    return {
      samples: samples.length,
      avg_ms: samples.length ? Math.round(sum / samples.length) : 0,
      median_ms: samples.length ? samples[Math.floor(samples.length / 2)] : 0,
      min_ms: samples.length ? samples[0] : 0,
      max_ms: samples.length ? samples[samples.length - 1] : 0,
      avg_seconds: samples.length ? Math.round((sum / samples.length) / 1000) : 0,
    };
  }

  async getMeetings(): Promise<any> {
    const { data: meetings } = await this.supabase.from('meetings').select('status, meeting_type, created_at');
    const rows = meetings || [];
    return {
      total: rows.length,
      by_status: this.countBy(rows, 'status'),
      by_type: this.countBy(rows, 'meeting_type'),
      trend: this.countByDate(rows, 'created_at'),
    };
  }

  async getRevenue(): Promise<any> {
    const { data: admissions } = await this.supabase.from('admissions').select('status, fee_paid, total_fee');
    const settings = await this.loadSettings();
    const rows = admissions || [];
    const paid = rows.filter((a: any) => a.status === 'completed' || a.fee_paid);
    const ticket = Number(settings.avgTicketValue) || 0;
    const total = paid.reduce((sum: number, a: any) => sum + (Number(a.total_fee) || ticket), 0);
    return {
      paid_admissions: paid.length,
      avg_ticket_value: ticket,
      revenue_estimated: Math.round(total),
    };
  }

  async exportCsv(): Promise<string> {
    const overview = await this.getOverview();
    const lines: string[] = ['metric,value'];
    const flatten = (obj: any, prefix = '') => {
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key);
        else lines.push(`"${key}","${v}"`);
      }
    };
    flatten(overview);
    return lines.join('\n');
  }

  // ── Helpers ──
  private async fetchEvents(): Promise<any[]> {
    try {
      const { data } = await this.supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(1000);
      return data || [];
    } catch (err: any) {
      this.logger.warn(`analytics_events unavailable: ${err.message}`);
      return [];
    }
  }

  private async loadSettings(): Promise<Record<string, string>> {
    try {
      const { data } = await this.supabase
        .from('settings')
        .select('key, value')
        .in('key', ['target_daily_leads', 'seat_target', 'avg_ticket_value']);
      const out: Record<string, string> = {};
      for (const row of data || []) out[this.toCamel(row.key)] = row.value;
      return out;
    } catch {
      return {};
    }
  }

  private countBy(rows: any[], field: string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const r of rows) {
      const key = r?.[field] || 'unknown';
      out[key] = (out[key] || 0) + 1;
    }
    return out;
  }

  private countByDate(rows: any[], field: string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const r of rows) {
      if (!r?.[field]) continue;
      const key = this.dateKey(new Date(r[field]));
      out[key] = (out[key] || 0) + 1;
    }
    return out;
  }

  private dateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private toCamel(key: string): string {
    return key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
  }
}

export { METRIC_EVENT_TYPES };
