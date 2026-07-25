import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { CategoryService } from './category.service';
import { RoutingService } from './routing.service';
import { NotificationService } from './notification.service';
import * as crypto from 'crypto';

@Injectable()
export class LeadService {
  constructor(
    private supabase: SupabaseClient,
    private categoryService: CategoryService,
    private routingService: RoutingService,
    private notificationService: NotificationService,
  ) {}

  async captureInboundLead(params: {
    source: string;
    source_reference_id?: string;
    first_name: string;
    phone?: string;
    email?: string;
    message?: string;
    content_type?: string;
    channel_message_id?: string;
    category?: string;
    categories?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const leadId = crypto.randomUUID();

    let categories = params.categories;
    if (!categories) {
      categories = this.categoryService.detect(params.message);
    }

    const categoryStr = categories.join(',');

    if (params.phone) {
      const { data: existing } = await this.supabase
        .from('leads')
        .select('id')
        .eq('phone', params.phone)
        .eq('is_active', true)
        .maybeSingle();

      if (existing) {
        await this.supabase
          .from('leads')
          .update({ last_contacted_at: new Date().toISOString() })
          .eq('id', existing.id);

        await this.storeMessage(existing.id, params.source, params.message || '', params.content_type || 'text', params.channel_message_id);
        return existing.id;
      }
    }

    await this.supabase.from('leads').insert({
      id: leadId,
      first_name: params.first_name.slice(0, 100),
      phone: params.phone || null,
      email: params.email || null,
      source: params.source,
      source_reference_id: params.source_reference_id || null,
      category: categoryStr,
      status: 'new',
      metadata: JSON.stringify(params.metadata || {}),
    });

    await this.supabase.from('workflow_instances').insert({
      id: crypto.randomUUID(),
      lead_id: leadId,
      current_state: 'new',
    });

    await this.supabase.from('timeline_events').insert({
      id: crypto.randomUUID(),
      lead_id: leadId,
      event_type_id: 'evt_lead_created',
      actor_type: 'automation',
      description: `Lead captured via ${params.source}`,
      metadata: JSON.stringify(params.metadata || {}),
    });

    if (params.message) {
      await this.storeMessage(leadId, params.source, params.message, params.content_type || 'text', params.channel_message_id);
    }

    await this.notificationService.notifyAdmins(leadId, params.first_name, params.source);

    await this.supabase
      .from('leads')
      .update({ category: categoryStr })
      .eq('id', leadId);

    await this.routingService.routeLead(leadId, params.source, categories);

    return leadId;
  }

  async storeMessage(leadId: string, channel: string, content: string, contentType: string, channelMessageId?: string): Promise<void> {
    const { data: channelRow } = await this.supabase
      .from('channels')
      .select('id')
      .eq('name', channel)
      .maybeSingle();

    const channelId = channelRow?.id || 'chan_web_form';

    const { data: convs } = await this.supabase
      .from('conversations')
      .select('id')
      .eq('lead_id', leadId)
      .eq('channel_id', channelId)
      .eq('status', 'active')
      .limit(1);

    let convId: string;
    if (!convs || convs.length === 0) {
      convId = crypto.randomUUID();
      await this.supabase.from('conversations').insert({
        id: convId,
        lead_id: leadId,
        channel_id: channelId,
        status: 'active',
      });
    } else {
      convId = convs[0].id;
    }

    const msgData: any = {
      id: crypto.randomUUID(),
      conversation_id: convId,
      lead_id: leadId,
      direction: 'inbound',
      content_type: contentType,
      content,
      status: 'sent',
    };
    if (channelMessageId) msgData.channel_message_id = channelMessageId;

    await this.supabase.from('messages').insert(msgData);

    await this.supabase.from('timeline_events').insert({
      id: crypto.randomUUID(),
      lead_id: leadId,
      event_type_id: 'evt_reply_received',
      actor_type: 'lead',
      description: `Message received via ${channel}: ${content.slice(0, 100)}`,
    });

    await this.supabase
      .from('leads')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', leadId);
  }
}
