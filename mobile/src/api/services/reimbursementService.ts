import api from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse } from '../../types/api.types';

export interface ReimbursementRequest {
  id: number;
  type: 'lunch' | 'snack';
  reference_id: number;
  settler_id: number;
  settler_name: string;
  settler_email: string;
  total_amount: number;
  status: 'pending' | 'admin_transferred' | 'user_confirmed' | 'user_disputed';
  admin_id: number | null;
  admin_name: string | null;
  admin_note: string | null;
  admin_transferred_at: string | null;
  user_response: 'received' | 'not_received' | null;
  user_confirmed_at: string | null;
  context_label: string | null; // session_date or snack title
  created_at: string;
}

export const reimbursementService = {
  async getPending(): Promise<ApiResponse<ReimbursementRequest[]>> {
    const { data } = await api.get<ApiResponse<ReimbursementRequest[]>>(ENDPOINTS.REIMBURSEMENTS_PENDING);
    return data;
  },

  async getAll(): Promise<ApiResponse<ReimbursementRequest[]>> {
    const { data } = await api.get<ApiResponse<ReimbursementRequest[]>>(ENDPOINTS.REIMBURSEMENTS_ALL);
    return data;
  },

  async getMine(): Promise<ApiResponse<ReimbursementRequest[]>> {
    const { data } = await api.get<ApiResponse<ReimbursementRequest[]>>(ENDPOINTS.REIMBURSEMENTS_MINE);
    return data;
  },

  async markTransferred(id: number, note?: string): Promise<ApiResponse> {
    const { data } = await api.put<ApiResponse>(ENDPOINTS.REIMBURSEMENT_TRANSFER(id), { note });
    return data;
  },

  async confirmReceipt(id: number, response: 'received' | 'not_received'): Promise<ApiResponse> {
    const { data } = await api.put<ApiResponse>(ENDPOINTS.REIMBURSEMENT_CONFIRM(id), { response });
    return data;
  },
};
