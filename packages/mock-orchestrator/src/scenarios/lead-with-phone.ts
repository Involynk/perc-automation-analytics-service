import axios from 'axios';
import { getSentMessages } from '../recorder';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

export async function run(): Promise<boolean> {
  console.log('\n=== SCENARIO: Lead with phone number ===');

  const res = await axios.post(`${GATEWAY_URL}/api/leads/capture`, {
    first_name: 'Rahul',
    phone: '+919876543210',
    source: 'whatsapp',
    message: 'I want to know about fees and courses',
  });

  const leadId: string = res.data.lead_id;
  console.log(`Lead created: ${leadId}`);

  const messages = getSentMessages();

  const whatsappMsg = messages.find(m => m.channel === 'whatsapp');
  if (whatsappMsg) {
    console.log(`✓ WhatsApp message sent to ${whatsappMsg.to}`);
    console.log(`  Text: "${whatsappMsg.text.slice(0, 80)}..."`);
  } else {
    console.log('✗ No WhatsApp message was sent');
    return false;
  }

  return true;
}
