export interface Notification {
  id: string;
  user_id: string;
  lead_id?: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  priority: string;
  metadata: string;
  created_at: string;
}
