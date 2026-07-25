export interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category?: string;
  is_editable: boolean;
  created_at: string;
  updated_at: string;
}
