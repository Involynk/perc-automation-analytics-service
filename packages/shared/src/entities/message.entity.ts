export interface Message {
  id: string;
  conversation_id: string;
  lead_id: string;
  direction: string;
  channel_message_id?: string;
  content_type: string;
  content: string;
  template_id?: string;
  metadata: string;
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  status: string;
}
