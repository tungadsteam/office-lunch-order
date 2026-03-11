'use client';

import { useAuthStore } from '../store/authStore';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const { user, token, isLoading, login, register, logout, fetchUser } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    router.push('/');
  };

  const handleRegister = async (data: { name: string; email: string; password: string; phone?: string }) => {
    await register(data);
    router.push('/');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    fetchUser,
  };
};
