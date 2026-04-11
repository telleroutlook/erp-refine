// src/providers/auth-provider.ts
// Refine AuthProvider backed by Supabase Auth via our BFF

import type { AuthProvider } from '@refinedev/core';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Login failed' }));
      return { success: false, error: { message: err.error ?? 'Login failed', name: 'LoginError' } };
    }

    const { data } = await response.json();
    localStorage.setItem('access_token', data.session.accessToken);
    localStorage.setItem('refresh_token', data.session.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    return { success: true, redirectTo: '/' };
  },

  logout: async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return { success: true, redirectTo: '/login' };
  },

  check: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return { authenticated: false, redirectTo: '/login' };

    // Lightweight check using stored user
    const user = localStorage.getItem('user');
    if (user) return { authenticated: true };

    return { authenticated: false, redirectTo: '/login' };
  },

  getIdentity: async () => {
    const user = localStorage.getItem('user');
    if (!user) return null;
    const parsed = JSON.parse(user);
    return {
      id: parsed.id,
      name: parsed.user_metadata?.full_name ?? parsed.email,
      email: parsed.email,
      avatar: parsed.user_metadata?.avatar_url,
    };
  },

  onError: async (error) => {
    if (error?.status === 401) {
      return { logout: true, redirectTo: '/login', error };
    }
    return { error };
  },
};
