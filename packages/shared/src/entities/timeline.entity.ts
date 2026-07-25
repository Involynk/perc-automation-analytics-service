export interface TimelineEvent {
  id: string;
  lead_id: string;
  event_type_id: string;
  actor_type: string;
  actor_id?: string;
  description: string;
  metadata: string;
  created_at: string;
}
