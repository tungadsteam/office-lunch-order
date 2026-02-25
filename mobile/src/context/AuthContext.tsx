import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user.types';
import { authService } from '../api/services/authService';
import { storage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await storage.getToken();
      if (storedToken) {
        setToken(storedToken);
        const response = await authService.getMe();
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          await storage.clear();
          setToken(null);
        }
      }
    } catch {
      await storage.clear();
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    if (response.success) {
      setUser(response.data.user);
      setToken(response.data.token);
      await storage.setToken(response.data.token);
      await storage.setUser(response.data.user);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authService.register(name, email, password);
    if (response.success) {
      setUser(response.data.user);
      setToken(response.data.token);
      await storage.setToken(response.data.token);
      await storage.setUser(response.data.user);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await storage.clear();
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      if (response.success && response.data) {
        setUser(response.data);
        await storage.setUser(response.data);
      }
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isAuthenticated: !!user && !!token, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
