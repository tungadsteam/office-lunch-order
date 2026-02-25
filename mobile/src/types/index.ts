// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  balance: number;
  rotation_index?: number;
  total_bought_times?: number;
  last_bought_date?: string;
  phone?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
  fcm_token?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

// Lunch Session types
export interface LunchSession {
  id: number;
  date: string;
  status: 'ordering' | 'buyers_selected' | 'buying' | 'payment_submitted' | 'settled' | 'cancelled';
  total_participants: number;
  buyer_ids: number[];
  buyers: User[];
  payer_id?: number;
  total_bill?: number;
  amount_per_person?: number;
}

// Order types
export interface Order {
  id: number;
  session_id: number;
  user_id: number;
  name?: string;
  email?: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
}

export interface TodayOrderResponse {
  success: boolean;
  data: {
    session: LunchSession;
    orders: Order[];
    is_joined: boolean;
  };
}

// Transaction types
export interface Transaction {
  id: number;
  user_id: number;
  type: 'deposit' | 'income' | 'expense' | 'refund' | 'adjustment';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  note?: string;
  created_at: string;
  session_date?: string;
}

export interface DepositRequest {
  amount: number;
  note?: string;
  bank_reference?: string;
}

// Admin types
export interface AdminStats {
  users: {
    total: number;
    total_balance: number;
  };
  sessions: {
    total: number;
    settled: number;
  };
  pending_deposits: {
    count: number;
    total_amount: number;
  };
  today: {
    id: number;
    status: string;
    participants: number;
    total_bill?: number;
  } | null;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}
