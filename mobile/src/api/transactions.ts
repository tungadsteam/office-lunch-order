import api from './axios';
import { ApiResponse, DepositRequest, Transaction } from '../types';

export const transactionsApi = {
  async createDeposit(data: DepositRequest): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/transactions/deposit', data);
    return response.data;
  },

  async getPending(): Promise<ApiResponse<Transaction[]>> {
    const response = await api.get<ApiResponse<Transaction[]>>('/transactions/pending');
    return response.data;
  },

  async approveDeposit(id: number): Promise<ApiResponse> {
    const response = await api.put<ApiResponse>(`/transactions/${id}/approve`);
    return response.data;
  },

  async rejectDeposit(id: number, reason?: string): Promise<ApiResponse> {
    const response = await api.put<ApiResponse>(`/transactions/${id}/reject`, { reason });
    return response.data;
  },

  async getHistory(limit = 50): Promise<ApiResponse<Transaction[]>> {
    const response = await api.get<ApiResponse<Transaction[]>>('/transactions/history', {
      params: { limit },
    });
    return response.data;
  },
};
