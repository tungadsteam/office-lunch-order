import { User } from './user.types';

export type SessionStatus = 'ordering' | 'buyers_selected' | 'buying' | 'payment_submitted' | 'settled' | 'cancelled';

export interface LunchSession {
  id: number;
  date: string;
  status: SessionStatus;
  total_participants: number;
  buyer_ids: number[];
  buyers: User[];
  payer_id?: number;
  total_bill?: number;
  amount_per_person?: number;
}

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
  session: LunchSession;
  orders: Order[];
  is_joined: boolean;
}

export interface OrderHistoryItem {
  session_id: number;
  session_date: string;
  status: SessionStatus;
  total_participants: number;
  total_bill?: number;
  amount_per_person?: number;
  was_buyer: boolean;
  was_payer: boolean;
  joined_at: string;
}
