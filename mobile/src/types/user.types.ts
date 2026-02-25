export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'user';
  balance: number;
  rotation_index?: number;
  total_bought_times?: number;
  last_bought_date?: string;
  notification_enabled?: boolean;
  is_active?: boolean;
  created_at?: string;
}
