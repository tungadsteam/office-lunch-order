import api from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse, AdminStats } from '../../types/api.types';
import { User } from '../../types/user.types';

export const adminService = {
  async getStats(): Promise<ApiResponse<AdminStats>> {
    const { data } = await api.get<ApiResponse<AdminStats>>(ENDPOINTS.ADMIN_STATS);
    return data;
  },

  async getBankInfo(): Promise<ApiResponse<Record<string, string>>> {
    const { data } = await api.get<ApiResponse<Record<string, string>>>(ENDPOINTS.BANK_INFO);
    return data;
  },

  async updateBankInfo(info: Record<string, string>): Promise<ApiResponse> {
    const { data } = await api.put<ApiResponse>(ENDPOINTS.BANK_INFO, info);
    return data;
  },

  async getUsers(): Promise<ApiResponse<User[]>> {
    const { data } = await api.get<ApiResponse<User[]>>(ENDPOINTS.ADMIN_USERS);
    return data;
  },

  async adjustBalance(userId: number, amount: number, note: string): Promise<ApiResponse> {
    const { data } = await api.put<ApiResponse>(ENDPOINTS.ADJUST_BALANCE(userId), { amount, note });
    return data;
  },
};
