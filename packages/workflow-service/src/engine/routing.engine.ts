import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, WorkflowInstance, TimelineEvent, PromiseEntity } from '@perc/shared';
import * as crypto from 'crypto';

const TWO_WAY_CHANNELS = ['instagram', 'facebook', 'email', 'website_chat'];

@Injectable()
export class RoutingEngine {
  constructor(
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(WorkflowInstance) private wfRepo: Repository<WorkflowInstance>,
    @InjectRepository(TimelineEvent) private tlRepo: Repository<TimelineEvent>,
    @InjectRepository(PromiseEntity) private promiseRepo: Repository<PromiseEntity>,
  ) {}

  async routeLead(leadId: string, sourceChannel: string): Promise<void> {
    const lead = await this.leadRepo.findOne({ where: { id: leadId } });
    if (!lead) return;

    if (lead.phone && lead.phone.startsWith('+')) {
      await this.routeToWhatsApp(lead);
    } else if (TWO_WAY_CHANNELS.includes(sourceChannel)) {
      await this.requestWhatsAppNumber(lead, sourceChannel);
    }
  }

  private async routeToWhatsApp(lead: Lead): Promise<void> {
    if (lead.status !== 'new') return;

    await this.leadRepo.update(lead.id, { status: 'information_shared' });
    await this.wfRepo.update({ lead_id: lead.id }, { current_state: 'information_shared' });

    await this.tlRepo.save({
      id: crypto.randomUUID(),
      lead_id: lead.id,
      event_type_id: 'evt_info_shared',
      actor_type: 'automation',
      description: `Routed to WhatsApp: ${lead.phone}`,
      metadata: JSON.stringify({ action: 'routed_to_whatsapp', phone: lead.phone }),
    });

    // Schedule first follow-up in 2 hours
    const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    await this.promiseRepo.save({
      id: crypto.randomUUID(),
      lead_id: lead.id,
      promise_type: 'followup',
      status: 'pending',
      scheduled_at: scheduledAt,
      payload: JSON.stringify({ action: 'followup_whatsapp', channel: 'whatsapp', attempt: 1 }),
    });
  }

  private async requestWhatsAppNumber(lead: Lead, channel: string): Promise<void> {
    await this.leadRepo.update(lead.id, { status: 'waiting' });
    await this.wfRepo.update({ lead_id: lead.id }, { current_state: 'waiting' });

    const catStr = lead.category || 'general_enquiry';
    await this.tlRepo.save({
      id: crypto.randomUUID(),
      lead_id: lead.id,
      event_type_id: 'evt_info_shared',
      actor_type: 'automation',
      description: `Asked for WhatsApp number via ${channel} (category: ${catStr})`,
      metadata: JSON.stringify({ channel, category: catStr, action: 'ask_whatsapp' }),
    });

    const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    await this.promiseRepo.save({
      id: crypto.randomUUID(),
      lead_id: lead.id,
      promise_type: 'followup',
      status: 'pending',
      scheduled_at: scheduledAt,
      payload: JSON.stringify({ action: 'check_whatsapp_reply', channel, attempt: 1 }),
    });
  }
}
