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
      }).catch((err) => {
        console.warn('Logout request failed:', err);
      });
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return { success: true, redirectTo: '/login' };
  },

  check: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return { authenticated: false, redirectTo: '/login' };

    // Check JWT expiry from the exp claim
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      const payload = JSON.parse(atob(padded));
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < nowSec) {
        // Token expired — attempt refresh
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (res.ok) {
            const { data } = await res.json();
            localStorage.setItem('access_token', data.session.accessToken);
            localStorage.setItem('refresh_token', data.session.refreshToken);
            return { authenticated: true };
          }
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        return { authenticated: false, redirectTo: '/login' };
      }
    } catch {
      // Malformed token — treat as unauthenticated
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      return { authenticated: false, redirectTo: '/login' };
    }

    const user = localStorage.getItem('user');
    if (user) return { authenticated: true };

    return { authenticated: false, redirectTo: '/login' };
  },

  getIdentity: async () => {
    const user = localStorage.getItem('user');
    if (!user) return null;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(user);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
    return {
      id: parsed['id'],
      name: (parsed['user_metadata'] as Record<string, unknown>)?.['full_name'] ?? parsed['email'],
      email: parsed['email'],
      avatar: (parsed['user_metadata'] as Record<string, unknown>)?.['avatar_url'],
    };
  },

  onError: async (error) => {
    if (error?.status === 401) {
      return { logout: true, redirectTo: '/login', error };
    }
    return { error };
  },
};
