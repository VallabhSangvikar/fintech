'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  full_name: string;
  email: string;
  organizationId?: string;
  organizationName?: string;
  organizationType?: string;
  role?: string;
  avatar_url?: string;
  last_login_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface SignupData {
  full_name: string;
  email: string;
  password: string;
  role: string;
  organization_name?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('userData');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Verify token is still valid
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Login failed',
        };
      }

      const { user: userData, token: authToken } = data.data;
      
      // Store auth data
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('userData', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);

      return { success: true };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (signupData: SignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Signup failed',
        };
      }

      const { user: userData, token: authToken } = data.data;
      
      // Store auth data
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('userData', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);

      return { success: true };

    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        // Call logout endpoint to invalidate token on server
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setToken(null);
      setUser(null);
      router.push('/');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token is invalid, clear auth state
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        const userData = data.data;
        localStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      // Clear auth state on error
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
