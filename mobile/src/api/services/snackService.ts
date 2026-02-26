import api from '../client';
import { ENDPOINTS } from '../endpoints';
import { ApiResponse } from '../../types/api.types';

export interface SnackMenu {
  id: number;
  title: string;
  status: 'ordering' | 'settled' | 'cancelled';
  total_amount: number;
  current_total: number;
  participant_count: number;
  creator_id: number;
  creator_name: string;
  settled_at: string | null;
  created_at: string;
}

export interface SnackItem {
  id: number;
  user_id: number;
  user_name: string;
  item_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface SnackParticipant {
  user_id: number;
  user_name: string;
  items: SnackItem[];
  user_total: number;
}

export interface SnackMenuDetail {
  menu: SnackMenu & { created_by: number; notes: string | null };
  participants: SnackParticipant[];
  grand_total: number;
  is_creator: boolean;
  my_items: SnackItem[];
}

export const snackService = {
  async getMenus(): Promise<ApiResponse<SnackMenu[]>> {
    const { data } = await api.get<ApiResponse<SnackMenu[]>>(ENDPOINTS.SNACKS);
    return data;
  },

  async createMenu(title: string, notes?: string): Promise<ApiResponse> {
    const { data } = await api.post<ApiResponse>(ENDPOINTS.SNACKS, { title, notes });
    return data;
  },

  async getMenu(id: number): Promise<ApiResponse<SnackMenuDetail>> {
    const { data } = await api.get<ApiResponse<SnackMenuDetail>>(ENDPOINTS.SNACK_DETAIL(id));
    return data;
  },

  async addItem(menuId: number, item_name: string, price: number, quantity = 1): Promise<ApiResponse> {
    const { data } = await api.post<ApiResponse>(ENDPOINTS.SNACK_ADD_ITEM(menuId), {
      item_name,
      price,
      quantity,
    });
    return data;
  },

  async removeItem(menuId: number, itemId: number): Promise<ApiResponse> {
    const { data } = await api.delete<ApiResponse>(ENDPOINTS.SNACK_REMOVE_ITEM(menuId, itemId));
    return data;
  },

  async settle(menuId: number): Promise<ApiResponse> {
    const { data } = await api.post<ApiResponse>(ENDPOINTS.SNACK_SETTLE(menuId));
    return data;
  },
};
