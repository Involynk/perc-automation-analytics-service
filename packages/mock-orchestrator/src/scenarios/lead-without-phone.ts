import axios from 'axios';
import { getByChannel } from '../recorder';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

export async function run(): Promise<boolean> {
  console.log('\n=== SCENARIO: Lead without phone (website_chat) ===');

  const res = await axios.post(`${GATEWAY_URL}/api/leads/capture`, {
    first_name: 'Priya',
    source: 'website_chat',
    message: 'Tell me about your programs',
  });

  const leadId: string = res.data.lead_id;
  console.log(`Lead created: ${leadId}`);

  const messages = getByChannel('unknown');
  const websiteMsg = messages.find(m => m.to === '' || m.to === leadId);

  if (messages.length > 0) {
    console.log(`✓ ${messages.length} message(s) sent`);
    messages.forEach(m => console.log(`  [${m.channel}] → ${m.to}: "${m.text.slice(0, 60)}..."`));
  } else {
    console.log('✗ No messages were sent for this scenario');
    return false;
  }

  return true;
}
