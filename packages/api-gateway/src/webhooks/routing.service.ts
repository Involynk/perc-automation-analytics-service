import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ChannelName, TWO_WAY_CHANNELS } from '@perc/shared';
import { CategoryService } from './category.service';
import { CommunicationClient, WorkflowClient } from './clients';
import * as crypto from 'crypto';

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  constructor(
    private supabase: SupabaseClient,
    private categoryService: CategoryService,
    private communicationClient: CommunicationClient,
    private workflowClient: WorkflowClient,
  ) {}

  async routeLead(leadId: string, sourceChannel: string, categories?: string[]): Promise<void> {
    const { data: lead } = await this.supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) return;

    if (lead.phone && lead.phone.startsWith('+')) {
      await this.routeToWhatsApp(lead);
    } else if (TWO_WAY_CHANNELS.includes(sourceChannel)) {
      await this.requestWhatsAppNumber(lead, sourceChannel, categories);
    }
  }

  private async routeToWhatsApp(lead: any): Promise<void> {
    if (lead.status !== 'new') return;

    const categories = (lead.category || '').split(',').filter(Boolean);
    const replyText = this.categoryService.composeGenericMessage(lead.first_name, categories);

    await this.supabase
      .from('leads')
      .update({ status: 'information_shared', last_contacted_at: new Date().toISOString() })
      .eq('id', lead.id);

    await this.supabase
      .from('workflow_instances')
      .update({ current_state: 'information_shared' })
      .eq('lead_id', lead.id);

    const sendResult = await this.communicationClient.send('whatsapp', lead.phone, replyText, lead.id);

    const { data: channelRow } = await this.supabase.from('channels').select('id').eq('name', 'whatsapp').maybeSingle();
    const channelId = channelRow?.id || 'chan_whatsapp';

    const { data: convs } = await this.supabase
      .from('conversations')
      .select('id')
      .eq('lead_id', lead.id)
      .eq('channel_id', channelId)
      .eq('status', 'active')
      .limit(1);

    let convId: string;
    if (!convs || convs.length === 0) {
      convId = crypto.randomUUID();
      await this.supabase.from('conversations').insert({
        id: convId, lead_id: lead.id, channel_id: channelId, status: 'active',
      });
    } else {
      convId = convs[0].id;
    }

    await this.supabase.from('messages').insert({
      id: crypto.randomUUID(),
      conversation_id: convId,
      lead_id: lead.id,
      direction: 'outbound',
      content_type: 'text',
      content: replyText,
      status: sendResult.success ? 'sent' : 'failed',
      sent_at: new Date().toISOString(),
    });

    await this.supabase.from('timeline_events').insert({
      id: crypto.randomUUID(),
      lead_id: lead.id,
      event_type_id: 'evt_info_shared',
      actor_type: 'automation',
      description: sendResult.success
        ? `Routed to WhatsApp: ${lead.phone}`
        : `WhatsApp send failed for ${lead.phone}: ${sendResult.error}`,
      metadata: JSON.stringify({
        action: 'routed_to_whatsapp',
        phone: lead.phone,
        success: sendResult.success,
        error: sendResult.error,
      }),
    });

    const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const promiseResult = await this.workflowClient.createPromise({
      lead_id: lead.id,
      promise_type: 'followup',
      scheduled_at: scheduledAt,
      payload: { action: 'check_whatsapp_reply', channel: 'whatsapp', attempt: 1 },
    });

    if (!promiseResult.success) {
      this.logger.warn(`Failed to schedule follow-up promise for lead ${lead.id}: ${promiseResult.error}`);
    }
  }

  private async requestWhatsAppNumber(lead: any, channel: string, categories?: string[]): Promise<void> {
    const catList = categories?.length ? categories : (lead.category || '').split(',').filter(Boolean);
    const replyText = this.categoryService.composeAskMessage(lead.first_name, catList);

    await this.supabase
      .from('leads')
      .update({ status: 'waiting', last_contacted_at: new Date().toISOString() })
      .eq('id', lead.id);

    await this.supabase
      .from('workflow_instances')
      .update({ current_state: 'waiting' })
      .eq('lead_id', lead.id);

    const sendResult = await this.communicationClient.send(channel, lead.source_reference_id || '', replyText, lead.id);

    const { data: channelRow } = await this.supabase.from('channels').select('id').eq('name', channel).maybeSingle();
    const channelId = channelRow?.id || 'chan_web_form';

    const { data: convs } = await this.supabase
      .from('conversations')
      .select('id')
      .eq('lead_id', lead.id)
      .eq('channel_id', channelId)
      .eq('status', 'active')
      .limit(1);

    let convId: string;
    if (!convs || convs.length === 0) {
      convId = crypto.randomUUID();
      await this.supabase.from('conversations').insert({
        id: convId, lead_id: lead.id, channel_id: channelId, status: 'active',
      });
    } else {
      convId = convs[0].id;
    }

    await this.supabase.from('messages').insert({
      id: crypto.randomUUID(),
      conversation_id: convId,
      lead_id: lead.id,
      direction: 'outbound',
      content_type: 'text',
      content: replyText,
      status: sendResult.success ? 'sent' : 'failed',
      sent_at: new Date().toISOString(),
    });

    const catStr = catList.join(',') || 'general_enquiry';
    await this.supabase.from('timeline_events').insert({
      id: crypto.randomUUID(),
      lead_id: lead.id,
      event_type_id: 'evt_info_shared',
      actor_type: 'automation',
      description: sendResult.success
        ? `Asked for WhatsApp number via ${channel} (categories: ${catStr})`
        : `Failed to send WhatsApp request via ${channel}: ${sendResult.error}`,
      metadata: JSON.stringify({
        channel, categories: catList, action: 'ask_whatsapp',
        success: sendResult.success, error: sendResult.error,
      }),
    });

    const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const promiseResult = await this.workflowClient.createPromise({
      lead_id: lead.id,
      promise_type: 'followup',
      scheduled_at: scheduledAt,
      payload: { action: 'check_whatsapp_reply', channel, attempt: 1 },
    });

    if (!promiseResult.success) {
      this.logger.warn(`Failed to schedule check-reply promise for lead ${lead.id}: ${promiseResult.error}`);
    }
  }
}
