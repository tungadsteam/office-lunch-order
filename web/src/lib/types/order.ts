export interface LunchSession {
  id: number;
  date: string;
  status: 'ordering' | 'open' | 'locked' | 'settled' | 'finalized';
  total_participants: number;
  total_bill?: number;
  per_person_cost?: number;
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
