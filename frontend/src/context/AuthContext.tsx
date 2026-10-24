'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, User, AuthTokens } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, password2: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedTokens = localStorage.getItem('fb_tokens');
        const storedUser = localStorage.getItem('fb_user');

        if (storedTokens && storedUser) {
          const parsedTokens: AuthTokens = JSON.parse(storedTokens);
          const parsedUser: User = JSON.parse(storedUser);

          setTokens(parsedTokens);
          setUser(parsedUser);

          // Verify token is still valid with backend
          try {
            const freshUser = await api.getProfile(parsedTokens.access);
            setUser(freshUser);
            localStorage.setItem('fb_user', JSON.stringify(freshUser));
          } catch {
            // Access token might be expired, try refreshing
            try {
              const refreshed = await api.refreshToken(parsedTokens.refresh);
              const updatedTokens = { ...parsedTokens, access: refreshed.access };
              setTokens(updatedTokens);
              localStorage.setItem('fb_tokens', JSON.stringify(updatedTokens));
            } catch {
              // Refresh failed, clean up
              localStorage.removeItem('fb_tokens');
              localStorage.removeItem('fb_user');
              setTokens(null);
              setUser(null);
            }
          }
        }
      } catch {
        localStorage.removeItem('fb_tokens');
        localStorage.removeItem('fb_user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setUser(res.user);
    setTokens(res.tokens);
    localStorage.setItem('fb_tokens', JSON.stringify(res.tokens));
    localStorage.setItem('fb_user', JSON.stringify(res.user));
    router.push('/dashboard');
  };

  const register = async (name: string, email: string, password: string, password2: string) => {
    const res = await api.register({ name, email, password, password2 });
    setUser(res.user);
    setTokens(res.tokens);
    localStorage.setItem('fb_tokens', JSON.stringify(res.tokens));
    localStorage.setItem('fb_user', JSON.stringify(res.user));
    router.push('/dashboard');
  };

  const logout = async () => {
    if (tokens?.refresh) {
      await api.logout(tokens.refresh, tokens.access);
    }
    setUser(null);
    setTokens(null);
    localStorage.removeItem('fb_tokens');
    localStorage.removeItem('fb_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, tokens, isLoading, login, register, logout }}>
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
