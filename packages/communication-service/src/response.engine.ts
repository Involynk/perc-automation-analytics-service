import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  ResponseEvent,
  TRIGGER_INTENT_COURSE_LIST,
  TRIGGER_INTENT_BRANCH_LIST,
} from '@perc/shared';
import { WhatsAppService } from './handlers/whatsapp.service';
import { InstagramService } from './handlers/instagram.service';
import { FacebookService } from './handlers/facebook.service';
import { EmailService } from './handlers/email.service';
import { TEMPLATES, renderTemplate } from './templates';

export interface ResponseResult {
  success: boolean;
  channel?: string;
  messageId?: string;
  template?: string;
  error?: string;
}

@Injectable()
export class ResponseEngine {
  private readonly logger = new Logger(ResponseEngine.name);

  constructor(
    private supabase: SupabaseClient,
    private whatsapp: WhatsAppService,
    private instagram: InstagramService,
    private facebook: FacebookService,
    private email: EmailService,
  ) {}

  async handle(event: ResponseEvent): Promise<ResponseResult> {
    const channel = event.target?.preferred_channel || event.source_channel;
    const to = event.target?.destination?.[channel];

    if (!to) {
      this.logger.warn(`No destination address for channel=${channel} event=${event.event_id}`);
      return { success: false, channel, error: `No destination address for channel ${channel}` };
    }

    const content = await this.loadTemplate(event.trigger_event);
    if (!content) {
      this.logger.warn(`No template found for ${event.trigger_event}`);
      return { success: false, channel, error: `No template for trigger_event ${event.trigger_event}` };
    }

    const vars = await this.hydrate(event.context, event.trigger_event);
    const body = renderTemplate(content, vars);

    this.logger.log(`Sending ${event.trigger_event} to ${channel} (${to}): ${body.slice(0, 80)}...`);

    let result: any;
    switch (channel) {
      case 'whatsapp':
        result = await this.whatsapp.sendText(to, body);
        break;
      case 'instagram':
        result = await this.instagram.sendText(to, body);
        break;
      case 'facebook':
        result = await this.facebook.sendText(to, body);
        break;
      case 'email':
        result = await this.email.sendReply(to, body);
        break;
      default:
        return { success: false, channel, error: `Unsupported channel ${channel}` };
    }

    return {
      success: true,
      channel,
      messageId: result?.messages?.[0]?.id || result?.message_id || undefined,
      template: event.trigger_event,
    };
  }

  private async loadTemplate(triggerEvent: string): Promise<string | null> {
    try {
      const { data } = await this.supabase
        .from('templates')
        .select('content')
        .eq('name', triggerEvent)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.content) return data.content;
    } catch (err: any) {
      this.logger.warn(`Template lookup failed for ${triggerEvent}: ${err.message}`);
    }

    return TEMPLATES[triggerEvent] || null;
  }

  private async hydrate(context: any, triggerEvent: string): Promise<Record<string, string>> {
    const vars: Record<string, string> = {
      lead_name: context?.lead_name || 'there',
      raw_user_message: context?.raw_user_message || '',
    };

    if (context?.course_id) {
      const { data: course } = await this.supabase
        .from('courses')
        .select('*')
        .eq('id', context.course_id)
        .maybeSingle();
      if (course) {
        vars.course_name = course.name || '';
        vars.course_duration = course.duration || '4 years';
        vars.course_eligibility = course.eligibility || 'Please contact our team';
        vars.syllabus_link = course.brochure_url || course.pdf_url || 'https://perc.edu';
        vars.fee_amount = (course as any).fee_amount || 'available with our admission team';
      }
    }

    if (context?.branch_id) {
      const { data: branch } = await this.supabase
        .from('branches')
        .select('*')
        .eq('id', context.branch_id)
        .maybeSingle();
      if (branch) {
        vars.branch_name = branch.name || '';
        vars.branch_address = branch.address || '';
        vars.map_link = branch.google_maps_link || '';
        vars.branch_contact_number = branch.contact_number || '';
      }
    }

    if (context?.counselor_id) {
      try {
        const { data: counselor } = await this.supabase
          .from('users')
          .select('first_name, phone')
          .eq('id', context.counselor_id)
          .maybeSingle();
        if (counselor) {
          vars.counselor_name = counselor.first_name || '';
          vars.counselor_phone = counselor.phone || '';
        }
      } catch (err: any) {
        this.logger.warn(`Counselor lookup failed: ${err.message}`);
      }
    }

    vars.counselor_text = vars.counselor_name
      ? `Your dedicated counselor ${vars.counselor_name} has been notified. `
      : '';

    if (triggerEvent === TRIGGER_INTENT_COURSE_LIST) {
      vars.course_list = await this.listCourseNames();
    }
    if (triggerEvent === TRIGGER_INTENT_BRANCH_LIST) {
      vars.branch_list = await this.listBranchNames();
    }

    return vars;
  }

  private async listCourseNames(): Promise<string> {
    try {
      const { data } = await this.supabase.from('courses').select('name').eq('is_active', true);
      return data?.map((c: any) => c.name).join(', ') || '';
    } catch {
      return '';
    }
  }

  private async listBranchNames(): Promise<string> {
    try {
      const { data } = await this.supabase.from('branches').select('name').eq('is_active', true);
      return data?.map((b: any) => b.name).join(', ') || '';
    } catch {
      return '';
    }
  }
}
