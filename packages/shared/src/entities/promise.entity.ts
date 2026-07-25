export interface PromiseEntity {
  id: string;
  lead_id: string;
  workflow_id?: string;
  promise_type: string;
  status: string;
  scheduled_at: string;
  executed_at?: string;
  cancelled_at?: string;
  cancelled_reason?: string;
  payload: string;
  result?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  is_recurring: boolean;
  recurring_interval?: string;
  created_at: string;
  updated_at: string;
}
