interface SentMessage {
  channel: string;
  to: string;
  text: string;
  leadId?: string;
  timestamp: string;
}

const sentMessages: SentMessage[] = [];

export function record(channel: string, to: string, text: string, leadId?: string): void {
  sentMessages.push({ channel, to, text, leadId, timestamp: new Date().toISOString() });
  console.log(`[RECORDER] ${channel} → ${to}: "${text.slice(0, 60)}..."`);
}

export function getSentMessages(): SentMessage[] {
  return [...sentMessages];
}

export function getByChannel(channel: string): SentMessage[] {
  return sentMessages.filter(m => m.channel === channel);
}

export function getByLead(leadId: string): SentMessage[] {
  return sentMessages.filter(m => m.leadId === leadId);
}

export function clear(): void {
  sentMessages.length = 0;
}
