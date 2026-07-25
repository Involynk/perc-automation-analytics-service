export interface Conversation {
  id: string;
  lead_id: string;
  channel_id: string;
  external_conversation_id?: string;
  status: string;
  started_at: string;
  ended_at?: string;
  metadata: string;
}
