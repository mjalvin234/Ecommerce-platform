import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, User } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    companyName: string;
    role: 'buyer' | 'seller';
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!api.getToken()) {
      setUser(null);
      return;
    }
    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch {
      api.clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password);
    setUser(result.user);
  };

  const register = async (data: {
    email: string;
    password: string;
    companyName: string;
    role: 'buyer' | 'seller';
  }) => {
    const result = await api.register(data);
    setUser(result.user);
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
