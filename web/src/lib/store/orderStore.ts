import { create } from 'zustand';
import { ordersService } from '../api/services/orders';
import { LunchSession } from '../types/order';

export interface Participant {
  id: number;
  user_id: number;
  user_name: string;
  is_buyer: boolean;
  status: string;
  created_at: string;
}

interface OrderState {
  todaySession: LunchSession | null;
  participants: Participant[];
  buyers: Participant[];
  isJoined: boolean;
  isLoading: boolean;
  fetchToday: () => Promise<void>;
  joinOrder: () => Promise<void>;
  leaveOrder: () => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  todaySession: null,
  participants: [],
  buyers: [],
  isJoined: false,
  isLoading: false,

  fetchToday: async () => {
    try {
      const response: any = await ordersService.getToday();
      const data = response.data;
      const session = data.session;
      const buyerIds: number[] = session?.buyer_ids || [];

      // Map backend "orders" to our participant format
      const orders = data.orders || data.participants || [];
      const participants: Participant[] = orders.map((o: any) => ({
        id: o.id,
        user_id: o.user_id,
        user_name: o.name || o.user_name || 'Unknown',
        is_buyer: buyerIds.includes(o.user_id),
        status: o.status,
        created_at: o.created_at,
      }));

      const buyersList = participants.filter((p) => p.is_buyer);

      set({
        todaySession: session,
        participants,
        buyers: buyersList,
        isJoined: data.is_joined || false,
      });
    } catch {
      set({ todaySession: null, participants: [], buyers: [], isJoined: false });
    }
  },

  joinOrder: async () => {
    set({ isLoading: true });
    try {
      await ordersService.join();
      await get().fetchToday();
    } finally {
      set({ isLoading: false });
    }
  },

  leaveOrder: async () => {
    set({ isLoading: true });
    try {
      await ordersService.leave();
      await get().fetchToday();
    } finally {
      set({ isLoading: false });
    }
  },
}));
