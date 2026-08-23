import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SupabaseClient } from '@supabase/supabase-js';
import { LeadCapturedEvent, ConversationMessage } from '@perc/shared';
import { CategoryService } from './category.service';
import * as crypto from 'crypto';

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);

  constructor(
    private supabase: SupabaseClient,
    private categoryService: CategoryService,
    private eventEmitter: EventEmitter2,
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
    let categories = params.categories;
    if (!categories) {
      categories = this.categoryService.detect(params.message);
    }

    const categoryStr = categories.join(',');

    const triggerEvent = this.categoryService.detectTriggerEvent(params.message);
    const confidence = this.categoryService.computeConfidence(params.message, triggerEvent);
    const entities = await this.categoryService.detectEntities(params.message);

    const existingLead = await this.findExistingLead(params.phone, params.email, params.source, params.source_reference_id);

    if (existingLead) {
      await this.supabase
        .from('leads')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', existingLead.id);

      const conversationHistory = params.message
        ? await this.storeConversationMessage(
            existingLead.id,
            params.source,
            params.message,
            params.content_type || 'text',
            params.channel_message_id,
          )
        : [];

      this.eventEmitter.emitAsync(
        'lead.captured',
        new LeadCapturedEvent(
          existingLead.id,
          params.source,
          existingLead.first_name || params.first_name,
          existingLead.phone || params.phone || null,
          existingLead.email || params.email || null,
          categories,
          params.message,
          params.metadata,
          triggerEvent,
          entities.course_id,
          entities.branch_id,
          undefined,
          confidence,
          false,
          conversationHistory,
        ),
      ).catch((err: Error) => this.logger.error(`lead.captured handler failed for existing lead: ${err.message}`, err.stack));

      return existingLead.id;
    }

    const leadId = crypto.randomUUID();
    const metadata = {
      ...(params.metadata || {}),
      trigger_event: triggerEvent,
      nlp_confidence_score: confidence,
      course_id: entities.course_id || null,
      branch_id: entities.branch_id || null,
    };

    await this.supabase.from('leads').insert({
      id: leadId,
      first_name: params.first_name.slice(0, 100),
      phone: params.phone || null,
      email: params.email || null,
      source: params.source,
      source_reference_id: params.source_reference_id || null,
      category: categoryStr,
      status: 'new',
      metadata: JSON.stringify(metadata),
    });

    const conversationHistory = params.message
      ? await this.storeConversationMessage(
          leadId,
          params.source,
          params.message,
          params.content_type || 'text',
          params.channel_message_id,
        )
      : [];

    this.eventEmitter.emitAsync(
      'lead.captured',
      new LeadCapturedEvent(
        leadId,
        params.source,
        params.first_name,
        params.phone || null,
        params.email || null,
        categories,
        params.message,
        params.metadata,
        triggerEvent,
        entities.course_id,
        entities.branch_id,
        undefined,
        confidence,
        true,
        conversationHistory,
      ),
    ).catch((err: Error) => this.logger.error(`lead.captured handler failed for new lead: ${err.message}`, err.stack));

    return leadId;
  }

  private async findExistingLead(
    phone?: string,
    email?: string,
    source?: string,
    sourceReferenceId?: string,
  ): Promise<any | null> {
    if (phone) {
      const { data } = await this.supabase
        .from('leads')
        .select('*')
        .eq('phone', phone)
        .eq('is_active', true)
        .maybeSingle();
      if (data) return data;
    }

    if (email) {
      const { data } = await this.supabase
        .from('leads')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle();
      if (data) return data;
    }

    if (source && sourceReferenceId) {
      const { data } = await this.supabase
        .from('leads')
        .select('*')
        .eq('source', source)
        .eq('source_reference_id', sourceReferenceId)
        .eq('is_active', true)
        .maybeSingle();
      if (data) return data;
    }

    return null;
  }

  async storeConversationMessage(
    leadId: string,
    channel: string,
    content: string,
    contentType: string,
    channelMessageId?: string,
  ): Promise<ConversationMessage[]> {
    const { data: channelRow } = await this.supabase
      .from('channels')
      .select('id')
      .eq('name', channel)
      .maybeSingle();

    const channelId = channelRow?.id || 'chan_web_form';

    const { data: convs } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', leadId)
      .eq('channel_id', channelId)
      .eq('status', 'active')
      .limit(1);

    let convId: string;
    let existingMessages: ConversationMessage[] = [];

    if (!convs || convs.length === 0) {
      convId = crypto.randomUUID();
    } else {
      convId = convs[0].id;
      if (convs[0].metadata) {
        try {
          const parsedMeta = typeof convs[0].metadata === 'string' ? JSON.parse(convs[0].metadata) : convs[0].metadata;
          if (Array.isArray(parsedMeta.messages)) {
            existingMessages = parsedMeta.messages;
          }
        } catch {
          existingMessages = [];
        }
      }
    }

    const newMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      direction: 'inbound',
      content_type: contentType,
      content,
      sent_at: new Date().toISOString(),
      channel_message_id: channelMessageId || undefined,
    };

    const updatedHistory = [...existingMessages, newMessage];

    await this.supabase.from('conversations').upsert({
      id: convId,
      lead_id: leadId,
      channel_id: channelId,
      status: 'active',
      metadata: JSON.stringify({ messages: updatedHistory }),
      started_at: convs?.[0]?.started_at || new Date().toISOString(),
    });

    await this.supabase
      .from('leads')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', leadId);

    return updatedHistory;
  }
}
