export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: import('./user.types').User;
    token: string;
  };
}

export interface AdminStats {
  users: { total: number; total_balance: number };
  sessions: { total: number; settled: number };
  pending_deposits: { count: number; total_amount: number };
  today: {
    id: number;
    status: string;
    participants: number;
    total_bill?: number;
  } | null;
}
