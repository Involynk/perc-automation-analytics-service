import axios from 'axios';
import { getSentMessages } from '../recorder';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

export async function run(): Promise<boolean> {
  console.log('\n=== SCENARIO: Meeting & Call Coordination Engine ===');

  // 1. Book a meeting for a lead
  const leadRes = await axios.post(`${GATEWAY_URL}/api/leads/capture`, {
    first_name: 'Meera',
    phone: '+919876543212',
    source: 'whatsapp',
    message: 'I want to know about fees',
  });
  const leadId: string = leadRes.data.lead_id;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);

  const bookRes = await axios.post(`${GATEWAY_URL}/api/meetings`, {
    lead_id: leadId,
    scheduled_at: tomorrow.toISOString(),
    meeting_type: 'call',
  });
  const meetingId: string = bookRes.data.meeting_id;
  console.log(`Meeting booked: ${meetingId}`);

  const bookedMsgs = getSentMessages();
  const confirm = bookedMsgs.find(m => m.channel === 'whatsapp');
  if (confirm && /confirmed/i.test(confirm.text)) {
    console.log(`✓ Confirmation message sent: "${confirm.text.slice(0, 90)}..."`);
  } else {
    console.log('✗ No confirmation message found');
    return false;
  }

  // 2. Trigger the meeting reminder (simulating the promise tick)
  await axios.post(`${GATEWAY_URL}/api/meetings/${meetingId}/reminder`);
  const reminderMsgs = getSentMessages();
  const reminder = reminderMsgs.find(m => /reminder/i.test(m.text));
  if (reminder) {
    console.log(`✓ Reminder sent: "${reminder.text.slice(0, 90)}..."`);
  } else {
    console.log('✗ No reminder message found');
    return false;
  }

  // 3. Complete the meeting → feedback request should be available
  await axios.put(`${GATEWAY_URL}/api/meetings/${meetingId}/complete`);
  await axios.post(`${GATEWAY_URL}/api/meetings/${meetingId}/feedback-request`);
  const feedbackMsgs = getSentMessages();
  const feedback = feedbackMsgs.find(m => /rating/i.test(m.text));
  if (feedback) {
    console.log(`✓ Feedback request sent: "${feedback.text.slice(0, 90)}..."`);
  } else {
    console.log('✗ No feedback message found');
    return false;
  }

  // 4. Submit feedback and verify the meeting record updated
  await axios.post(`${GATEWAY_URL}/api/meetings/${meetingId}/feedback`, { rating: 5, feedback: 'Great call' });
  const meeting = await axios.get(`${GATEWAY_URL}/api/meetings/${meetingId}`);
  if (meeting.data.feedback_rating === 5) {
    console.log(`✓ Feedback recorded: ${meeting.data.feedback_rating}/5`);
  } else {
    console.log('✗ Feedback not recorded');
    return false;
  }

  return true;
}
