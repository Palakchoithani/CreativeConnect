'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleRefreshToken = useCallback(async (storedRefreshToken: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        return data.token;
      }
    } catch (e) {
      console.error('Failed to perform background token refresh:', e);
    }
    return null;
  }, []);

  const validateToken = useCallback(async (storedToken: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(storedToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        // Try refreshing first before logging out
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (storedRefreshToken) {
          const newToken = await handleRefreshToken(storedRefreshToken);
          if (newToken) {
            await validateToken(newToken);
            return;
          }
        }
        logout();
      }
    } catch {
      // Network error — keep existing state to allow offline viewing
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    }
  }, [handleRefreshToken]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      validateToken(storedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [validateToken]);

  // Silent token refresh loop every 15 minutes
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (storedRefreshToken) {
        await handleRefreshToken(storedRefreshToken);
      }
    }, 15 * 60 * 1000); // 15 minutes
    return () => clearInterval(interval);
  }, [token, handleRefreshToken]);

  const refreshUser = useCallback(async () => {
    if (token) await validateToken(token);
  }, [token, validateToken]);

  const login = (newToken: string, newRefreshToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${storedToken}` }
      }).catch(err => console.error('Logout request failed', err));
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
