import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SupabaseClient } from '@supabase/supabase-js';
import { LeadCapturedEvent } from '@perc/shared';
import { NotificationService } from '../notification.service';
import * as crypto from 'crypto';

@Injectable()
export class LeadCapturedListener {
  private readonly logger = new Logger(LeadCapturedListener.name);

  constructor(
    private supabase: SupabaseClient,
    private notificationService: NotificationService,
  ) {}

  @OnEvent('lead.captured')
  async handle(event: LeadCapturedEvent): Promise<void> {
    if (event.isNewLead) {
      const { data: existingWorkflow } = await this.supabase
        .from('workflow_instances')
        .select('id')
        .eq('lead_id', event.leadId)
        .maybeSingle();

      if (!existingWorkflow) {
        await this.supabase.from('workflow_instances').insert({
          id: crypto.randomUUID(),
          lead_id: event.leadId,
          current_state: 'new',
        });
      }

      await this.notificationService.notifyAdmins(event.leadId, event.firstName, event.source);
    }

    this.logger.log(
      `[LeadCapturedListener] Lead event processed for leadId=${event.leadId} isNewLead=${event.isNewLead} messagesCount=${event.conversationHistory?.length || 0}`,
    );
  }
}
