export interface Channel {
  id: string;
  name: string;
  display_name?: string;
  is_active: boolean;
  config: string;
  created_at: string;
}
