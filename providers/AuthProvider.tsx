'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie'; // Use js-cookie in client

interface AuthContextType {
  isAuthenticated: boolean;
  user: {
    _id: string;
    email: string;
    wrikeId: string;
    webworkId: number;
    createdAt: string | Date;
  } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: () => {},
  loading: false,
  error: null,
  clearError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check authentication status on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('token');

      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.data);
          setIsAuthenticated(true);
        } else {
          Cookies.remove('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        Cookies.remove('token');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token in cookie (set expiration to match token expiry)
      Cookies.set('token', data.token, { expires: data.expiresIn / (60 * 60 * 24) }); // expiresIn is in seconds

      // Fetch user data
      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });

      if (!userRes.ok) throw new Error('Failed to get user data');

      const userData = await userRes.json();
      setUser(userData.data);
      setIsAuthenticated(true);
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};
