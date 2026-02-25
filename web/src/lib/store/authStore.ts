import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../api/services/auth';
import { User } from '../types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response: any = await authService.login(email, password);
          const { token, user } = response.data;
          localStorage.setItem('auth_token', token);
          set({ user, token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response: any = await authService.register(data);
          const { token, user } = response.data;
          localStorage.setItem('auth_token', token);
          set({ user, token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null });
      },

      fetchUser: async () => {
        try {
          const response: any = await authService.getMe();
          set({ user: response.data });
        } catch {
          // Token invalid
          localStorage.removeItem('auth_token');
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
