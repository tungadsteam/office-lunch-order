import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth';
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check stored token on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await storage.getToken();
      if (storedToken) {
        setToken(storedToken);
        // Verify token with server
        const response = await authApi.getMe();
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          await storage.clear();
          setToken(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await storage.clear();
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    if (response.success) {
      const { user: userData, token: newToken } = response.data;
      setUser(userData);
      setToken(newToken);
      await storage.setToken(newToken);
      await storage.setUser(userData);
    } else {
      throw new Error('Login failed');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authApi.register({ email, password, name });
    if (response.success) {
      const { user: userData, token: newToken } = response.data;
      setUser(userData);
      setToken(newToken);
      await storage.setToken(newToken);
      await storage.setUser(userData);
    } else {
      throw new Error('Registration failed');
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await storage.clear();
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        setUser(response.data);
        await storage.setUser(response.data);
      }
    } catch (error) {
      console.error('Refresh user failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
