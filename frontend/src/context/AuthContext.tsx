'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '@/services/api';
import { toast } from 'sonner';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  notifications?: {
    orderUpdates?: boolean;
    promotions?: boolean;
  };
  role: 'user' | 'admin' | 'cashier';
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone: string) => Promise<User>;
  verifyEmail: (otp: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  updateProfile: (data: any) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.warn('Failed to parse stored user:', error);
          localStorage.removeItem('user');
        }
      }
      return;
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!token) return;

    let active = true;

    const loadProfile = async () => {
      if (!active) return;
      setIsLoading(true);

      try {
        const response = await userAPI.getProfile();
        if (!active) return;
        const body = response?.data ?? response;
        const payload = body?.data ?? body;
        const profile = payload?.user ?? payload?.data ?? payload;
        setUser(profile as any);
        localStorage.setItem('user', JSON.stringify(profile));
      } catch (error: any) {
        if (!active) return;
        console.error('Failed to refresh user profile:', error);

        const status = error.response?.status;
        if (!error.response || status === 401 || status === 403) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });
      const body = response?.data ?? response;
      const payload = body?.data ?? body;
      const token = body?.token || payload?.token;
      const userPayload = body?.user || payload?.user || payload?.data || payload;
      if (token) {
        setToken(token as string);
        localStorage.setItem('token', token as string);
      }
      if (userPayload) {
        setUser(userPayload as any);
        localStorage.setItem('user', JSON.stringify(userPayload));
      }
      toast.success('Login successful');
      return userPayload as any;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register({ name, email, password, phone });
      const body = response?.data ?? response;
      const payload = body?.data ?? body;
      const token = body?.token || payload?.token;
      const userPayload = body?.user || payload?.user || payload?.data || payload;
      if (token) {
        setToken(token as string);
        localStorage.setItem('token', token as string);
      }
      if (userPayload) {
        setUser(userPayload as any);
        localStorage.setItem('user', JSON.stringify(userPayload));
      }
      toast.success('Registration successful');
      return userPayload as any;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (otp: string) => {
    try {
      setIsLoading(true);
      await authAPI.verifyEmail({ otp });
      setUser((current) => {
        const updated = current ? { ...current, isVerified: true } : current;
        if (updated) {
          localStorage.setItem('user', JSON.stringify(updated));
        }
        return updated;
      });
      toast.success('Email verified successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setIsLoading(true);
      await authAPI.resendOtp();
      toast.success('Verification code sent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend code');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    try {
      setIsLoading(true);
      const response = await userAPI.updateProfile(data);
      const body = response?.data ?? response;
      const payload = body?.data ?? body;
      const profile = payload?.user ?? payload?.data ?? payload;
      const normalizedProfile = { ...(profile as any), id: (profile as any)?.id || (profile as any)?._id || (user as any)?.id || (user as any)?._id }; 
      setUser(normalizedProfile as any);
      localStorage.setItem('user', JSON.stringify(normalizedProfile));
      toast.success('Profile updated successfully');
      return normalizedProfile as any;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('Logout request failed, clearing client state anyway:', error);
    }

    // Clear client state and storage
    setUser(null);
    setToken(null);

    try {
      // remove known localStorage keys
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('mokshya_guest_wishlist');
      localStorage.removeItem('cart-storage');

      // clear sessionStorage
      sessionStorage.clear();

      // clear all cookies for the current domain
      if (typeof document !== 'undefined') {
        document.cookie.split(';').forEach((c) => {
          const eqPos = c.indexOf('=');
          const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
          // expire cookie
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
        });
      }

      // try clearing cart store if available
      try {
        // lazy require to avoid circular imports at module load
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useCartStore } = require('@/context/cartStore');
        const cart = useCartStore.getState();
        if (cart && typeof cart.clearCart === 'function') cart.clearCart();
      } catch (err) {
        // ignore
      }

      // clear guest wishlist helper if available
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const wishlist = require('@/lib/wishlist');
        if (wishlist && typeof wishlist.clearGuestWishlist === 'function') wishlist.clearGuestWishlist();
      } catch (err) {
        // ignore
      }

      toast.success('Logged out successfully');
    } catch (err) {
      console.warn('Failed to fully clear local state during logout:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!(token || user),
        login,
        register,
        verifyEmail,
        resendOtp,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
