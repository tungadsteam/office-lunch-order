import api from '../client';
import { ENDPOINTS } from '../endpoints';
import { AuthResponse, ApiResponse } from '../../types/api.types';
import { User } from '../../types/user.types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(ENDPOINTS.LOGIN, { email, password });
    return data;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(ENDPOINTS.REGISTER, { email, password, name });
    return data;
  },

  async getMe(): Promise<ApiResponse<User>> {
    const { data } = await api.get<ApiResponse<User>>(ENDPOINTS.ME);
    return data;
  },
};
