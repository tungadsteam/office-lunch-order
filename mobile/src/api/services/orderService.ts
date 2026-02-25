import api from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse } from '../../types/api.types';
import { TodayOrderResponse, OrderHistoryItem } from '../../types/order.types';

export const orderService = {
  async getToday(): Promise<ApiResponse<TodayOrderResponse>> {
    const { data } = await api.get<ApiResponse<TodayOrderResponse>>(ENDPOINTS.ORDERS_TODAY);
    return data;
  },

  async joinToday(): Promise<ApiResponse> {
    const { data } = await api.post<ApiResponse>(ENDPOINTS.ORDERS_JOIN);
    return data;
  },

  async leaveToday(): Promise<ApiResponse> {
    const { data } = await api.delete<ApiResponse>(ENDPOINTS.ORDERS_LEAVE);
    return data;
  },

  async selectBuyers(): Promise<ApiResponse> {
    const { data } = await api.post<ApiResponse>(ENDPOINTS.ORDERS_SELECT_BUYERS);
    return data;
  },

  async submitPayment(totalBill: number, billImageUrl?: string): Promise<ApiResponse> {
    const { data } = await api.post<ApiResponse>(ENDPOINTS.ORDERS_PAYMENT, {
      total_bill: totalBill,
      bill_image_url: billImageUrl,
    });
    return data;
  },

  async getHistory(limit = 30): Promise<ApiResponse<OrderHistoryItem[]>> {
    const { data } = await api.get<ApiResponse<OrderHistoryItem[]>>(ENDPOINTS.ORDERS_HISTORY, {
      params: { limit },
    });
    return data;
  },

  async getById(id: number): Promise<ApiResponse> {
    const { data } = await api.get<ApiResponse>(ENDPOINTS.ORDER_DETAIL(id));
    return data;
  },
};
