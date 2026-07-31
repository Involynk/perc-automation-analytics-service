import { SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import {
  TRIGGER_ENQUIRY_RECEIVED,
  TRIGGER_INTENT_GENERAL_INFO,
  TRIGGER_INTENT_TIMINGS,
  TRIGGER_INTENT_CONTACT_DETAILS,
  TRIGGER_INTENT_ADMISSION_PROCESS,
  TRIGGER_INTENT_COURSE_LIST,
  TRIGGER_INTENT_COURSE_DETAILS,
  TRIGGER_INTENT_ELIGIBILITY,
  TRIGGER_INTENT_SYLLABUS,
  TRIGGER_INTENT_FEE_STRUCTURE,
  TRIGGER_INTENT_SCHOLARSHIP,
  TRIGGER_INTENT_REFUND_POLICY,
  TRIGGER_INTENT_BRANCH_LIST,
  TRIGGER_INTENT_BRANCH_LOCATION,
  TRIGGER_INTENT_HOSTEL_FACILITY,
  TRIGGER_HANDOVER_REQUESTED,
  TRIGGER_HANDOVER_COMPLAINT,
} from './trigger-events';

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

const BRANCHES = [
  {
    id: 'brn_main',
    name: 'PERC Main Campus',
    address: 'MG Road, Bengaluru, Karnataka 560001',
    google_maps_link: 'https://maps.google.com/?q=PERC+Main+Campus',
    contact_number: '+91 80 4567 8900',
    working_hours: 'Mon-Sat 9am-6pm',
  },
  {
    id: 'brn_west',
    name: 'PERC West Campus',
    address: 'Whitefield, Bengaluru, Karnataka 560066',
    google_maps_link: 'https://maps.google.com/?q=PERC+West+Campus',
    contact_number: '+91 80 4321 7700',
    working_hours: 'Mon-Sat 9am-6pm',
  },
];

const TEMPLATES: { id: string; name: string; template_type: string; content: string; category: string }[] = [
  {
    id: 'tpl_enquiry_received',
    name: TRIGGER_ENQUIRY_RECEIVED,
    template_type: 'welcome',
    content: 'Hi {{lead_name}}, thanks for reaching out to PERC! Could you please share your WhatsApp number so we can send you all the details?',
    category: 'general',
  },
  {
    id: 'tpl_intent_general_info',
    name: TRIGGER_INTENT_GENERAL_INFO,
    template_type: 'general_enquiry',
    content: 'Hi {{lead_name}}, thanks for your interest in PERC! Our team will share detailed information with you shortly. For anything urgent, you can reach us at +91 80 4567 8900.',
    category: 'general',
  },
  {
    id: 'tpl_intent_timings',
    name: TRIGGER_INTENT_TIMINGS,
    template_type: 'general_enquiry',
    content: 'Hi {{lead_name}}, our office hours are 9 AM to 6 PM, Monday to Saturday. You can also message us anytime and we will get back to you.',
    category: 'general',
  },
  {
    id: 'tpl_intent_contact_details',
    name: TRIGGER_INTENT_CONTACT_DETAILS,
    template_type: 'general_enquiry',
    content: 'Hi {{lead_name}}, you can reach us at +91 80 4567 8900 or email admissions@perc.edu. Our team will be happy to help!',
    category: 'general',
  },
  {
    id: 'tpl_intent_admission_process',
    name: TRIGGER_INTENT_ADMISSION_PROCESS,
    template_type: 'admission_process',
    content: 'Hi {{lead_name}}, the admission process is simple: 1) Share your details, 2) Submit the required documents, 3) Pay the admission fee. Our team will guide you through each step.',
    category: 'general',
  },
  {
    id: 'tpl_intent_course_list',
    name: TRIGGER_INTENT_COURSE_LIST,
    template_type: 'course_enquiry',
    content: 'Hi {{lead_name}}, we offer the following programs: {{course_list}}. Which one are you interested in?',
    category: 'course',
  },
  {
    id: 'tpl_intent_course_details',
    name: TRIGGER_INTENT_COURSE_DETAILS,
    template_type: 'course_enquiry',
    content: 'Hi {{lead_name}}, here are the details for {{course_name}}: Duration - {{course_duration}}; Eligibility - {{course_eligibility}}. Brochure: {{syllabus_link}}',
    category: 'course',
  },
  {
    id: 'tpl_intent_eligibility',
    name: TRIGGER_INTENT_ELIGIBILITY,
    template_type: 'course_enquiry',
    content: 'Hi {{lead_name}}, the eligibility for {{course_name}} is: {{course_eligibility}}. Would you like to know more about the admission process?',
    category: 'course',
  },
  {
    id: 'tpl_intent_syllabus',
    name: TRIGGER_INTENT_SYLLABUS,
    template_type: 'course_enquiry',
    content: 'Hi {{lead_name}}, here is the syllabus/brochure for {{course_name}}: {{syllabus_link}}',
    category: 'course',
  },
  {
    id: 'tpl_intent_fee_structure',
    name: TRIGGER_INTENT_FEE_STRUCTURE,
    template_type: 'fee_enquiry',
    content: 'Hi {{lead_name}}, the fee for {{course_name}} is {{fee_amount}}. Download the syllabus here: {{syllabus_link}}',
    category: 'fee',
  },
  {
    id: 'tpl_intent_scholarship',
    name: TRIGGER_INTENT_SCHOLARSHIP,
    template_type: 'scholarship_enquiry',
    content: 'Hi {{lead_name}}, we offer scholarships and discounts for eligible students. Our team will share the scholarship criteria with you soon.',
    category: 'general',
  },
  {
    id: 'tpl_intent_refund_policy',
    name: TRIGGER_INTENT_REFUND_POLICY,
    template_type: 'general_enquiry',
    content: 'Hi {{lead_name}}, our refund policy allows cancellations within the first week of admission. Our team will share the full policy details with you.',
    category: 'general',
  },
  {
    id: 'tpl_intent_branch_list',
    name: TRIGGER_INTENT_BRANCH_LIST,
    template_type: 'branch_enquiry',
    content: 'Hi {{lead_name}}, we have centers at the following locations: {{branch_list}}. Which one is closest to you?',
    category: 'general',
  },
  {
    id: 'tpl_intent_branch_location',
    name: TRIGGER_INTENT_BRANCH_LOCATION,
    template_type: 'branch_enquiry',
    content: 'Hi {{lead_name}}, {{branch_name}} is located at {{branch_address}}. Map link: {{map_link}} | Contact: {{branch_contact_number}}',
    category: 'general',
  },
  {
    id: 'tpl_intent_hostel_facility',
    name: TRIGGER_INTENT_HOSTEL_FACILITY,
    template_type: 'hostel_enquiry',
    content: 'Hi {{lead_name}}, we offer hostel accommodation near {{branch_name}}. Our team will share the hostel details with you.',
    category: 'general',
  },
  {
    id: 'tpl_handover_requested',
    name: TRIGGER_HANDOVER_REQUESTED,
    template_type: 'notification',
    content: 'Hi {{lead_name}}, I am connecting you with our team right away. {{counselor_text}}They will reach out to you within 15 minutes.',
    category: 'general',
  },
  {
    id: 'tpl_handover_complaint',
    name: TRIGGER_HANDOVER_COMPLAINT,
    template_type: 'notification',
    content: 'Hi {{lead_name}}, we are sorry to hear that. Our team will look into this immediately and get back to you.',
    category: 'general',
  },
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

  for (const b of BRANCHES) {
    const { data: existing } = await supabase.from('branches').select('id').eq('id', b.id).maybeSingle();
    if (!existing) {
      const { error } = await supabase.from('branches').insert({
        id: b.id, name: b.name, address: b.address, google_maps_link: b.google_maps_link,
        contact_number: b.contact_number, working_hours: b.working_hours,
        is_active: true, created_at: new Date().toISOString(),
      });
      if (error) console.warn(`Branch seed skipped (${b.id}): ${error.message}`);
    }
  }

  for (const t of TEMPLATES) {
    const { data: existing } = await supabase.from('templates').select('id').eq('name', t.name).maybeSingle();
    if (!existing) {
      const now = new Date().toISOString();
      const { error } = await supabase.from('templates').insert({
        id: t.id, name: t.name, template_type: t.template_type, content: t.content,
        channel_id: null, variables: '[]', language: 'en', version: 1,
        is_active: true, category: t.category, metadata: '{}', created_at: now, updated_at: now,
      });
      if (error) console.warn(`Template seed skipped (${t.id}): ${error.message}`);
    }
  }

  console.log(
    `Database seeded: ${CHANNELS.length} channels, ${EVENT_TYPES.length} event types, ` +
    `${SETTINGS.length} settings, ${BRANCHES.length} branches, ${TEMPLATES.length} templates`,
  );
}
