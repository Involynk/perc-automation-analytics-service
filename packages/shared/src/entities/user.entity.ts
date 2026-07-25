export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'counselor' | 'teacher' | 'student';
  phone?: string;
  avatar_url?: string;
  notification_preferences: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
