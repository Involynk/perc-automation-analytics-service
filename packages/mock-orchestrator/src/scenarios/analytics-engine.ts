import axios from 'axios';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

export async function run(): Promise<boolean> {
  console.log('\n=== SCENARIO: Analytics Engine — event-first metrics & dashboards ===');

  // 1. Capture leads from different sources (drives lead + source + conversion analytics)
  const ts = Date.now();
  const leadRes = await axios.post(`${GATEWAY_URL}/api/leads/capture`, {
    first_name: 'AnalyticsTest',
    phone: `+9198765433${String(ts).slice(-6)}`,
    source: 'whatsapp',
    message: 'how much is the b.tech fee?',
  });
  const leadId: string = leadRes.data.lead_id;
  await new Promise(r => setTimeout(r, 1200));

  // 2. Book + complete a meeting so conversion and meeting analytics update
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);
  const bookRes = await axios.post(`${GATEWAY_URL}/api/meetings`, {
    lead_id: leadId,
    scheduled_at: tomorrow.toISOString(),
    meeting_type: 'call',
  });
  const meetingId: string = bookRes.data.meeting_id;
  await new Promise(r => setTimeout(r, 800));
  await axios.put(`${GATEWAY_URL}/api/meetings/${meetingId}/complete`);
  await new Promise(r => setTimeout(r, 800));

  // 3. Overview shows the events reflected in real time
  const overview = (await axios.get(`${GATEWAY_URL}/api/analytics/overview`)).data;
  const conversions = (await axios.get(`${GATEWAY_URL}/api/analytics/conversions`)).data;
  const responseTimes = (await axios.get(`${GATEWAY_URL}/api/analytics/response-times`)).data;

  let ok = true;

  if (overview.total_leads >= 1 && overview.leads_by_source?.whatsapp >= 1) {
    console.log(`✓ Overview: total_leads=${overview.total_leads}, by_source=${JSON.stringify(overview.leads_by_source)}`);
  } else {
    console.log(`✗ Overview leads not reflected: ${JSON.stringify(overview)}`);
    ok = false;
  }

  if (overview.total_meetings >= 1 && (overview.meetings_by_status?.completed || 0) >= 1) {
    console.log(`✓ Meetings: total=${overview.total_meetings}, status=${JSON.stringify(overview.meetings_by_status)}`);
  } else {
    console.log(`✗ Meeting analytics not reflected: ${JSON.stringify(overview.meetings_by_status)}`);
    ok = false;
  }

  if (conversions.funnel?.meeting_completed >= 1 && conversions.total_leads >= 1) {
    console.log(`✓ Conversions: funnel=${JSON.stringify(conversions.funnel)} rate=${conversions.enquiry_to_meeting_completed}%`);
  } else {
    console.log(`✗ Conversion funnel not reflected: ${JSON.stringify(conversions)}`);
    ok = false;
  }

  if (responseTimes.samples >= 1) {
    console.log(`✓ Response time: avg=${responseTimes.avg_ms}ms (${responseTimes.avg_seconds}s) over ${responseTimes.samples} sample(s)`);
  } else {
    console.log('✗ No response-time samples recorded (lead → response gap missing)');
    ok = false;
  }

  return ok;
}
