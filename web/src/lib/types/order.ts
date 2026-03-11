export interface LunchSession {
  id: number;
  date: string;
  status: 'ordering' | 'open' | 'locked' | 'buyers_selected' | 'buying' | 'settled' | 'finalized';
  total_participants: number;
  buyer_ids?: number[];
  payer_id?: number | null;
  payer_name?: string | null;
  total_bill?: number;
  per_person_cost?: number;
  amount_per_person?: number;
  created_at: string;
}

export interface OrderParticipant {
  id: number;
  user_id: number;
  user_name: string;
  is_buyer: boolean;
  joined_at: string;
}

export interface TodayOrderResponse {
  success: boolean;
  data: {
    session: LunchSession | null;
    participants: OrderParticipant[];
    is_joined: boolean;
    buyers: OrderParticipant[];
  };
}

export interface OrderHistoryItem {
  id: number;
  date: string;
  status: string;
  total_participants: number;
  total_bill?: number;
  per_person_cost?: number;
}
