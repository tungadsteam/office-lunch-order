export type TransactionType = 'deposit' | 'income' | 'expense' | 'refund' | 'adjustment';
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Transaction {
  id: number;
  user_id: number;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  note?: string;
  created_at: string;
  session_date?: string;
  name?: string;
  email?: string;
}

export interface DepositRequest {
  amount: number;
  note?: string;
  bank_reference?: string;
}
