export interface Lead {
  id: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  source: string;
  source_reference_id?: string;
  category?: string;
  status: string;
  classification?: string;
  assigned_to?: string;
  assigned_at?: string;
  last_contacted_at?: string;
  next_scheduled_action?: string;
  metadata: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
