import { SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

function uuid(): string {
  return crypto.randomUUID();
}

const CHANNELS = [
  { id: 'chan_whatsapp', name: 'whatsapp', display_name: 'WhatsApp' },
  { id: 'chan_instagram', name: 'instagram', display_name: 'Instagram' },
  { id: 'chan_facebook', name: 'facebook', display_name: 'Facebook Messenger' },
  { id: 'chan_email', name: 'email', display_name: 'Email' },
  { id: 'chan_web_form', name: 'website_form', display_name: 'Website Form' },
  { id: 'chan_web_chat', name: 'website_chat', display_name: 'Website Chat' },
  { id: 'chan_google', name: 'google_business', display_name: 'Google Business' },
  { id: 'chan_phone', name: 'phone', display_name: 'Phone Call' },
  { id: 'chan_walkin', name: 'walkin', display_name: 'Walk-in' },
  { id: 'chan_referral', name: 'referral', display_name: 'Referral' },
  { id: 'chan_sms', name: 'sms', display_name: 'SMS' },
];

const EVENT_TYPES = [
  { id: 'evt_lead_created', name: 'Lead Created', description: 'New enquiry captured', category: 'system' },
  { id: 'evt_info_shared', name: 'Information Shared', description: 'Automated response sent to lead', category: 'automation' },
  { id: 'evt_reply_received', name: 'Reply Received', description: 'Lead replied to a message', category: 'lead' },
  { id: 'evt_admin_action', name: 'Admin Action', description: 'Manual action performed by admin', category: 'admin' },
  { id: 'evt_followup_sent', name: 'Follow-up Sent', description: 'Automated follow-up message sent', category: 'automation' },
];

const SETTINGS = [
  { key: 'working_hours', value: '{"start": "09:00", "end": "18:00", "timezone": "Asia/Kolkata"}', description: 'Default working hours', category: 'calendar' },
  { key: 'followup_timings', value: '{"first": "2 hours", "second": "1 day", "third": "3 days", "escalation": "24 hours"}', description: 'Follow-up timing intervals', category: 'automation' },
  { key: 'auto_response_enabled', value: 'true', description: 'Enable/disable auto responses globally', category: 'automation' },
];

export async function seedDatabase(supabase: SupabaseClient): Promise<void> {
  for (const c of CHANNELS) {
    const { data: existing } = await supabase.from('channels').select('id').eq('name', c.name).maybeSingle();
    if (!existing) {
      await supabase.from('channels').insert({ id: c.id, name: c.name, display_name: c.display_name, is_active: true, config: '{}' });
    }
  }

  for (const et of EVENT_TYPES) {
    const { data: existing } = await supabase.from('event_types').select('id').eq('name', et.name).maybeSingle();
    if (!existing) {
      await supabase.from('event_types').insert({ id: et.id, name: et.name, description: et.description, category: et.category });
    }
  }

  for (const s of SETTINGS) {
    const { data: existing } = await supabase.from('settings').select('id').eq('key', s.key).maybeSingle();
    if (!existing) {
      await supabase.from('settings').insert({ id: uuid(), key: s.key, value: s.value, description: s.description, category: s.category });
    }
  }

  console.log(`Database seeded: ${CHANNELS.length} channels, ${EVENT_TYPES.length} event types, ${SETTINGS.length} settings`);
}
