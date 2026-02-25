import api from './axios';
import { ApiResponse, AdminStats, User } from '../types';

export const adminApi = {
  async getStats(): Promise<ApiResponse<AdminStats>> {
    const response = await api.get<ApiResponse<AdminStats>>('/admin/stats');
    return response.data;
  },

  async getBankInfo(): Promise<ApiResponse> {
    const response = await api.get<ApiResponse>('/admin/bank-info');
    return response.data;
  },

  async updateBankInfo(data: {
    bank_account_number?: string;
    bank_account_name?: string;
    bank_name?: string;
  }): Promise<ApiResponse> {
    const response = await api.put<ApiResponse>('/admin/bank-info', data);
    return response.data;
  },

  async getUsers(): Promise<ApiResponse<User[]>> {
    const response = await api.get<ApiResponse<User[]>>('/admin/users');
    return response.data;
  },

  async adjustBalance(userId: number, amount: number, note: string): Promise<ApiResponse> {
    const response = await api.put<ApiResponse>(`/admin/users/${userId}/balance`, {
      amount,
      note,
    });
    return response.data;
  },
};
