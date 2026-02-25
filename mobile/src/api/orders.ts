import api from './axios';
import { TodayOrderResponse, ApiResponse } from '../types';

export const ordersApi = {
  async getToday(): Promise<TodayOrderResponse> {
    const response = await api.get<TodayOrderResponse>('/orders/today');
    return response.data;
  },

  async joinToday(): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/orders/today/join');
    return response.data;
  },

  async leaveToday(): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>('/orders/today/leave');
    return response.data;
  },

  async selectBuyers(): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/orders/today/select-buyers');
    return response.data;
  },

  async submitPayment(totalBill: number, billImageUrl?: string): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/orders/today/payment', {
      total_bill: totalBill,
      bill_image_url: billImageUrl,
    });
    return response.data;
  },

  async getHistory(limit = 30): Promise<ApiResponse> {
    const response = await api.get<ApiResponse>('/orders/history', { params: { limit } });
    return response.data;
  },

  async getById(id: number): Promise<ApiResponse> {
    const response = await api.get<ApiResponse>(`/orders/${id}`);
    return response.data;
  },
};
