import api from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse } from '../../types/api.types';
import { Transaction, DepositRequest } from '../../types/transaction.types';

export const transactionService = {
  async createDeposit(request: DepositRequest): Promise<ApiResponse> {
    const { data } = await api.post<ApiResponse>(ENDPOINTS.DEPOSIT, request);
    return data;
  },

  async getPending(): Promise<ApiResponse<Transaction[]>> {
    const { data } = await api.get<ApiResponse<Transaction[]>>(ENDPOINTS.PENDING_DEPOSITS);
    return data;
  },

  async approve(id: number): Promise<ApiResponse> {
    const { data } = await api.put<ApiResponse>(ENDPOINTS.APPROVE_DEPOSIT(id));
    return data;
  },

  async reject(id: number, reason?: string): Promise<ApiResponse> {
    const { data } = await api.put<ApiResponse>(ENDPOINTS.REJECT_DEPOSIT(id), { reason });
    return data;
  },

  async getHistory(limit = 50): Promise<ApiResponse<Transaction[]>> {
    const { data } = await api.get<ApiResponse<Transaction[]>>(ENDPOINTS.TRANSACTION_HISTORY, {
      params: { limit },
    });
    return data;
  },
};
