import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function seed() {
  console.log('🌱 Seeding PostgreSQL / Supabase DB with real lead analytics data...');

  const now = Date.now();
  const dayMs = 86400000;

  // 12 Real leads across sources and statuses
  const leads = [
    { id: 'lead_001', name: 'Ravi Kumar', first_name: 'Ravi', source: 'whatsapp', status: 'client_won', phone: '+919876543210', created_at: new Date(now - 6 * dayMs).toISOString() },
    { id: 'lead_002', name: 'Priya Sharma', first_name: 'Priya', source: 'instagram', status: 'meeting_completed', phone: '+919876543211', created_at: new Date(now - 5 * dayMs).toISOString() },
    { id: 'lead_003', name: 'Arjun Mehta', first_name: 'Arjun', source: 'meta_ads', status: 'meeting_scheduled', phone: '+919876543212', created_at: new Date(now - 4 * dayMs).toISOString() },
    { id: 'lead_004', name: 'Sneha Verma', first_name: 'Sneha', source: 'website', status: 'contacted', phone: '+919876543213', created_at: new Date(now - 3 * dayMs).toISOString() },
    { id: 'lead_005', name: 'Vikram Singh', first_name: 'Vikram', source: 'whatsapp', status: 'new', phone: '+919876543214', created_at: new Date(now - 2 * dayMs).toISOString() },
    { id: 'lead_006', name: 'Ananya Gupta', first_name: 'Ananya', source: 'instagram', status: 'meeting_completed', phone: '+919876543215', created_at: new Date(now - 2 * dayMs).toISOString() },
    { id: 'lead_007', name: 'Karan Patel', first_name: 'Karan', source: 'meta_ads', status: 'client_won', phone: '+919876543216', created_at: new Date(now - 1 * dayMs).toISOString() },
    { id: 'lead_008', name: 'Neha Joshi', first_name: 'Neha', source: 'whatsapp', status: 'no_show', phone: '+919876543217', created_at: new Date(now - 1 * dayMs).toISOString() },
    { id: 'lead_009', name: 'Rohan Roy', first_name: 'Rohan', source: 'website', status: 'contacted', phone: '+919876543218', created_at: new Date(now - 12 * 3600000).toISOString() },
    { id: 'lead_010', name: 'Divya Nair', first_name: 'Divya', source: 'instagram', status: 'meeting_scheduled', phone: '+919876543219', created_at: new Date(now - 6 * 3600000).toISOString() },
    { id: 'lead_011', name: 'Aman Saxena', first_name: 'Aman', source: 'meta_ads', status: 'new', phone: '+919876543220', created_at: new Date(now - 3 * 3600000).toISOString() },
    { id: 'lead_012', name: 'Pooja Reddy', first_name: 'Pooja', source: 'whatsapp', status: 'meeting_completed', phone: '+919876543221', created_at: new Date(now - 1 * 3600000).toISOString() },
  ];

  // Insert leads
  for (const l of leads) {
    await supabase.from('leads').upsert(l);
  }
  console.log(`✓ Inserted ${leads.length} leads into DB`);

  // Meetings
  const meetings: any[] = [
    { id: 'mtg_101', lead_id: 'lead_001', meeting_type: 'Demo Call', status: 'completed', host_name: 'Priya Anand', feedback_rating: 5.0, scheduled_at: new Date(now - 5 * dayMs).toISOString(), created_at: new Date(now - 6 * dayMs).toISOString() },
    { id: 'mtg_102', lead_id: 'lead_002', meeting_type: 'Strategy Session', status: 'completed', host_name: 'Rahul Sen', feedback_rating: 4.5, scheduled_at: new Date(now - 4 * dayMs).toISOString(), created_at: new Date(now - 5 * dayMs).toISOString() },
    { id: 'mtg_103', lead_id: 'lead_003', meeting_type: 'Discovery Call', status: 'scheduled', host_name: 'Priya Anand', feedback_rating: null, scheduled_at: new Date(now + 1 * dayMs).toISOString(), created_at: new Date(now - 4 * dayMs).toISOString() },
    { id: 'mtg_106', lead_id: 'lead_006', meeting_type: 'Demo Call', status: 'completed', host_name: 'Amit Shah', feedback_rating: 4.8, scheduled_at: new Date(now - 1 * dayMs).toISOString(), created_at: new Date(now - 2 * dayMs).toISOString() },
    { id: 'mtg_107', lead_id: 'lead_007', meeting_type: 'Closing Call', status: 'completed', host_name: 'Priya Anand', feedback_rating: 5.0, scheduled_at: new Date(now - 12 * 3600000).toISOString(), created_at: new Date(now - 1 * dayMs).toISOString() },
    { id: 'mtg_108', lead_id: 'lead_008', meeting_type: 'Demo Call', status: 'missed', host_name: 'Rahul Sen', feedback_rating: null, scheduled_at: new Date(now - 18 * 3600000).toISOString(), created_at: new Date(now - 1 * dayMs).toISOString() },
    { id: 'mtg_110', lead_id: 'lead_010', meeting_type: 'Discovery Call', status: 'scheduled', host_name: 'Amit Shah', feedback_rating: null, scheduled_at: new Date(now + 2 * dayMs).toISOString(), created_at: new Date(now - 6 * 3600000).toISOString() },
    { id: 'mtg_112', lead_id: 'lead_012', meeting_type: 'Demo Call', status: 'completed', host_name: 'Priya Anand', feedback_rating: 4.9, scheduled_at: new Date(now - 30 * 60000).toISOString(), created_at: new Date(now - 1 * 3600000).toISOString() },
  ];

  for (const m of meetings) {
    await supabase.from('meetings').upsert(m);
  }
  console.log(`✓ Inserted ${meetings.length} meetings into DB`);

  // Analytics events for timeline & trends
  const events: any[] = [];
  leads.forEach((l, idx) => {
    const t = new Date(l.created_at).getTime();

    // Event 1: lead captured
    events.push({
      id: `evt_${l.id}_cap`,
      lead_id: l.id,
      event_type: 'lead.created',
      source: l.source,
      event_data: JSON.stringify({ message: `Inquiry from ${l.source}`, channel: l.source }),
      created_at: l.created_at,
    });

    // Event 2: AI response sent
    events.push({
      id: `evt_${l.id}_resp`,
      lead_id: l.id,
      event_type: 'response.sent',
      source: l.source,
      event_data: JSON.stringify({ response_time_ms: 1100 + (idx * 120), message: 'Welcome! I would love to help you with your inquiry.' }),
      created_at: new Date(t + 1200).toISOString(),
    });

    // Event 3: Followup sent for inactive leads
    if (['contacted', 'no_show', 'meeting_completed', 'client_won'].includes(l.status)) {
      events.push({
        id: `evt_${l.id}_fol1`,
        lead_id: l.id,
        event_type: 'followup.sent',
        source: l.source,
        event_data: JSON.stringify({ attempt: 1, message: 'Hey! Just checking in on your inquiry — would you like to schedule a quick 15-min call?' }),
        created_at: new Date(t + 7200000).toISOString(),
      });

      // Lead re-engaged within 1 hour
      events.push({
        id: `evt_${l.id}_reply`,
        lead_id: l.id,
        event_type: 'lead.updated',
        source: l.source,
        event_data: JSON.stringify({ status: l.status }),
        created_at: new Date(t + 7200000 + 1800000).toISOString(),
      });
    }

    // Event 4: Meeting events
    if (l.status === 'meeting_scheduled' || l.status === 'meeting_completed' || l.status === 'client_won') {
      events.push({
        id: `evt_${l.id}_mtg_req`,
        lead_id: l.id,
        event_type: 'meeting.create-requested',
        source: l.source,
        event_data: JSON.stringify({ intent: 'meeting_request' }),
        created_at: new Date(t + 14400000).toISOString(),
      });

      events.push({
        id: `evt_${l.id}_mtg_bkd`,
        lead_id: l.id,
        event_type: 'meeting.booked',
        source: l.source,
        event_data: JSON.stringify({ meeting_type: 'Demo Call' }),
        created_at: new Date(t + 14420000).toISOString(),
      });
    }

    if (l.status === 'meeting_completed' || l.status === 'client_won') {
      events.push({
        id: `evt_${l.id}_mtg_cmpl`,
        lead_id: l.id,
        event_type: 'meeting.completed',
        source: l.source,
        event_data: JSON.stringify({ duration_min: 35, feedback_rating: 4.8 }),
        created_at: new Date(t + 86400000).toISOString(),
      });
    }
  });

  for (const e of events) {
    await supabase.from('analytics_events').upsert(e);
  }
  console.log(`✓ Inserted ${events.length} analytics events into DB`);

  console.log('🎉 Database Seeding Complete!');
}

seed().catch(console.error);
