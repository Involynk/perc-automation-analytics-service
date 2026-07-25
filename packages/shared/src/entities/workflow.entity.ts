export interface WorkflowInstance {
  id: string;
  lead_id: string;
  current_state: string;
  previous_state?: string;
  is_paused: boolean;
  is_completed: boolean;
  completed_at?: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowHistory {
  id: string;
  workflow_id: string;
  lead_id: string;
  from_state: string;
  to_state: string;
  trigger_event?: string;
  triggered_by: string;
  triggered_by_id?: string;
  metadata: string;
  created_at: string;
}
