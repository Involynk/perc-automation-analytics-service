import { spawn, ChildProcess } from 'child_process';
import { startMockServer } from './mock-server';
import axios from 'axios';

const MOCK_PORT = 9100;
const ROOT = process.cwd();

async function waitFor(url: string, label: string, timeoutMs = 20000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await axios.get(url, { timeout: 2000 });
      console.log(`  ✓ ${label} is ready`);
      return;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  console.log(`  ⚠ ${label} health-check timed out, proceeding anyway`);
}

function startService(
  name: string,
  mainJs: string,
  env: Record<string, string> = {},
): ChildProcess {
  const proc = spawn('node', [mainJs], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
  proc.stdout?.on('data', (d: Buffer) => process.stdout.write(`[${name}] ${d}`));
  proc.stderr?.on('data', (d: Buffer) => process.stderr.write(`[${name}] ${d}`));
  proc.on('error', (err) => console.error(`[${name}] error:`, err.message));
  return proc;
}

async function main() {
  console.log('=== Mock Orchestrator ===\n');

  console.log('Starting mock API server...');
  const mockServer = await startMockServer(MOCK_PORT);
  const mockBase = `http://localhost:${MOCK_PORT}`;
  const commEnv = {
    WHATSAPP_API_BASE_URL: mockBase,
    INSTAGRAM_API_BASE_URL: mockBase,
    FACEBOOK_API_BASE_URL: mockBase,
    WHATSAPP_PHONE_NUMBER_ID: 'mock_pid',
    WHATSAPP_ACCESS_TOKEN: 'mock_token',
    INSTAGRAM_ACCESS_TOKEN: 'mock_token',
    FACEBOOK_PAGE_ACCESS_TOKEN: 'mock_token',
    COMMUNICATION_SERVICE_URL: 'http://localhost:3001',
    WORKFLOW_SERVICE_URL: 'http://localhost:3002',
    PORT: '3001',
  };

  const comm = startService('comm', 'packages/communication-service/dist/main.js', commEnv);
  await waitFor('http://localhost:3001/api/messages/send', 'Communication Service');

  const wf = startService('workflow', 'packages/workflow-service/dist/main.js', { DB_PATH: './perc_dev.db', PORT: '3002' });
  await waitFor('http://localhost:3002/api/workflow/promises', 'Workflow Service');

  const gw = startService('gateway', 'packages/api-gateway/dist/main.js', { ...commEnv, PORT: '3000' });
  await waitFor('http://localhost:3000/health', 'API Gateway');

  async function fetchRecorded() {
    const res = await axios.get(`${mockBase}/recorded`);
    return res.data.messages || [];
  }

  async function clearRecorded() {
    await axios.post(`${mockBase}/clear`);
  }

  console.log('\n--- Running scenarios ---\n');
  let passed = 0;
  let failed = 0;

  const ts = Date.now();

  // Scenario 1: WhatsApp lead with phone → Response Engine sends hydrated fee template
  await clearRecorded();
  try {
    const r1 = await axios.post('http://localhost:3000/api/leads/capture', {
      first_name: 'Rahul',
      phone: `+9198765432${String(ts).slice(-6)}`,
      source: 'whatsapp',
      message: 'how much is the b.tech fee?',
    });
    await new Promise(r => setTimeout(r, 2500));
    const recorded = await fetchRecorded();
    const waMsgs = recorded.filter((m: any) => m.channel === 'whatsapp');
    if (waMsgs.length > 0) {
      const text = waMsgs[0].text;
      const hydrated = text.includes('fee for B.Tech') || text.includes('fee structure');
      console.log(`✓ Lead ${r1.data.lead_id}: Response Engine sent to ${waMsgs[0].to}`);
      console.log(`    "${text.slice(0, 120)}${text.length > 120 ? '...' : ''}"`);
      if (!hydrated) console.log('    ⚠ message not hydrated with course data');
      passed++;
    } else {
      const chans = recorded.map((m: any) => m.channel);
      console.log(`✗ No WhatsApp message recorded (${chans.length} total: ${chans.join(', ')})`);
      failed++;
    }
  } catch (err: any) {
    console.log(`✗ Scenario 1 error: ${err.message}`);
    failed++;
  }

  // Scenario 2: Instagram lead without phone but with IG user ID → should ask for WhatsApp number
  await clearRecorded();
  try {
    const r2 = await axios.post('http://localhost:3000/api/leads/capture', {
      first_name: 'Priya',
      source: 'instagram',
      source_reference_id: 'ig_12345',
      message: 'tell me about programs',
    });
    await new Promise(r => setTimeout(r, 2000));
    const recorded = await fetchRecorded();
    const igMsgs = recorded.filter((m: any) => m.channel === 'instagram');
    if (igMsgs.length > 0) {
      console.log(`✓ Lead ${r2.data.lead_id}: Instagram ask-welcome sent to ${igMsgs[0].to}`);
      passed++;
    } else {
      const chans = recorded.map((m: any) => m.channel);
      console.log(`✗ No Instagram message recorded (${chans.length} total: ${chans.join(', ')})`);
      failed++;
    }
  } catch (err: any) {
    console.log(`✗ Scenario 2 error: ${err.message}`);
    failed++;
  }

  // Scenario 3: Call & Meeting Coordination Engine — book → confirm → reminder → complete → feedback
  await clearRecorded();
  try {
    const leadRes = await axios.post('http://localhost:3000/api/leads/capture', {
      first_name: 'Meera',
      phone: `+9198765432${String(ts + 1).slice(-6)}`,
      source: 'whatsapp',
      message: 'how much is the b.tech fee?',
    });
    const leadId = leadRes.data.lead_id;
    await new Promise(r => setTimeout(r, 1500));

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setMinutes(0, 0, 0);
    const bookRes = await axios.post('http://localhost:3000/api/meetings', {
      lead_id: leadId,
      scheduled_at: tomorrow.toISOString(),
      meeting_type: 'call',
    });
    const meetingId = bookRes.data.meeting_id;
    await new Promise(r => setTimeout(r, 1500));

    const recorded = await fetchRecorded();
    const confirm = recorded.find((m: any) => m.channel === 'whatsapp' && /confirmed/i.test(m.text));
    if (confirm) {
      console.log(`✓ Meeting booked ${meetingId}: confirmation sent → "${confirm.text.slice(0, 90)}..."`);
      passed++;
    } else {
      console.log('✗ No meeting confirmation recorded');
      failed++;
      await axios.put(`http://localhost:3000/api/meetings/${meetingId}/cancel`).catch(() => {});
    }

    // Simulate meeting_reminder promise firing
    await axios.post(`http://localhost:3000/api/meetings/${meetingId}/reminder`);
    await new Promise(r => setTimeout(r, 1200));
    const reminder = (await fetchRecorded()).find((m: any) => m.channel === 'whatsapp' && /reminder/i.test(m.text));
    if (reminder) {
      console.log(`✓ Reminder sent → "${reminder.text.slice(0, 90)}..."`);
      passed++;
    } else {
      console.log('✗ No reminder recorded');
      failed++;
    }

    // Complete + feedback request (simulating feedback promise firing)
    await axios.put(`http://localhost:3000/api/meetings/${meetingId}/complete`);
    await axios.post(`http://localhost:3000/api/meetings/${meetingId}/feedback-request`);
    await new Promise(r => setTimeout(r, 1200));
    const feedback = (await fetchRecorded()).find((m: any) => m.channel === 'whatsapp' && /rating/i.test(m.text));
    if (feedback) {
      console.log(`✓ Feedback request sent → "${feedback.text.slice(0, 90)}..."`);
      passed++;
    } else {
      console.log('✗ No feedback request recorded');
      failed++;
    }

    // Submit feedback → rating persisted
    await axios.post(`http://localhost:3000/api/meetings/${meetingId}/feedback`, { rating: 5, feedback: 'Great call' });
    const meeting = await axios.get(`http://localhost:3000/api/meetings/${meetingId}`);
    if (meeting.data.feedback_rating === 5) {
      console.log(`✓ Feedback recorded: ${meeting.data.feedback_rating}/5`);
      passed++;
    } else {
      console.log('✗ Feedback rating not persisted');
      failed++;
    }
  } catch (err: any) {
    console.log(`✗ Scenario 3 error: ${err.message}`);
    failed++;
  }

  // Scenario 4: Lead messages "book a call" → MeetingRequestedListener offers slots
  await clearRecorded();
  try {
    const r4 = await axios.post('http://localhost:3000/api/leads/capture', {
      first_name: 'Arjun',
      phone: `+9198765432${String(ts + 2).slice(-6)}`,
      source: 'whatsapp',
      message: 'book a call',
    });
    await new Promise(r => setTimeout(r, 2500));
    const recorded = await fetchRecorded();
    const slots = recorded.find((m: any) => m.channel === 'whatsapp' && /available slots/i.test(m.text));
    if (slots) {
      console.log(`✓ Meeting intent ${r4.data.lead_id}: slot options sent → "${slots.text.slice(0, 100)}..."`);
      passed++;
    } else {
      const texts = recorded.map((m: any) => m.text?.slice(0, 60)).join(' | ');
      console.log(`✗ No slot options recorded (${texts || 'none'})`);
      failed++;
    }
  } catch (err: any) {
    console.log(`✗ Scenario 4 error: ${err.message}`);
    failed++;
  }

  // Scenario 5: Analytics Engine — capture leads, book+complete a meeting, verify real-time metrics
  try {
    const aLead = await axios.post('http://localhost:3000/api/leads/capture', {
      first_name: 'Analytics',
      phone: `+9198765433${String(ts + 3).slice(-6)}`,
      source: 'whatsapp',
      message: 'how much is the b.tech fee?',
    });
    const aLeadId = aLead.data.lead_id;
    await new Promise(r => setTimeout(r, 1200));

    const aMeeting = await axios.post('http://localhost:3000/api/meetings', {
      lead_id: aLeadId,
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      meeting_type: 'call',
    });
    await new Promise(r => setTimeout(r, 800));
    await axios.put(`http://localhost:3000/api/meetings/${aMeeting.data.meeting_id}/complete`);
    await new Promise(r => setTimeout(r, 800));

    const overview = (await axios.get('http://localhost:3000/api/analytics/overview')).data;
    const conversions = (await axios.get('http://localhost:3000/api/analytics/conversions')).data;
    const responseTimes = (await axios.get('http://localhost:3000/api/analytics/response-times')).data;

    if (overview.total_leads >= 1 && (overview.meetings_by_status?.completed || 0) >= 1) {
      console.log(`✓ Analytics overview: leads=${overview.total_leads}, meetings=${overview.total_meetings}, response=${responseTimes.avg_seconds}s`);
      passed++;
    } else {
      console.log(`✗ Analytics overview incomplete: ${JSON.stringify(overview)}`);
      failed++;
    }

    if (conversions.funnel?.meeting_completed >= 1 && responseTimes.samples >= 1) {
      console.log(`✓ Conversions funnel updated (${conversions.enquiry_to_meeting_completed}%), response-time samples=${responseTimes.samples}`);
      passed++;
    } else {
      console.log(`✗ Conversions/response-time not reflected: ${JSON.stringify(conversions)} / ${JSON.stringify(responseTimes)}`);
      failed++;
    }
  } catch (err: any) {
    console.log(`✗ Scenario 5 error: ${err.message}`);
    failed++;
  }

  console.log('\n--- Cleaning up ---');
  gw.kill('SIGTERM'); wf.kill('SIGTERM'); comm.kill('SIGTERM');
  mockServer.close();

  console.log(`\n=== Results: ${passed}/${passed + failed} passed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
