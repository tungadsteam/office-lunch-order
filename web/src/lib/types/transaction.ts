export interface Transaction {
  id: number;
  user_id: number;
  user_name?: string;
  type: 'deposit' | 'expense' | 'income' | 'adjustment';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  created_at: string;
}

export interface DepositRequest {
  amount: number;
  note?: string;
}
