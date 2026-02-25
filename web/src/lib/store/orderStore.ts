import { create } from 'zustand';
import { ordersService } from '../api/services/orders';
import { LunchSession, OrderParticipant } from '../types/order';

interface OrderState {
  todaySession: LunchSession | null;
  participants: OrderParticipant[];
  buyers: OrderParticipant[];
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
      set({
        todaySession: data.session,
        participants: data.participants || [],
        buyers: data.buyers || [],
        isJoined: data.is_joined || false,
      });
    } catch {
      // No session today
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
