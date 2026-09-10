import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { UserSummary } from '@faro/types';
import { API_URL } from '../services/api-config';

const ACCESS_TOKEN_KEY = 'faro.accessToken';
const REFRESH_TOKEN_KEY = 'faro.refreshToken';

interface AuthState {
  user: UserSummary | null;
  accessToken: string | null;
  refreshToken: string | null;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (user: UserSummary, accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: UserSummary) => void;
  refreshTokens: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hasHydrated: false,

  hydrate: async () => {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);
    set({ accessToken, refreshToken, hasHydrated: true });
    if (accessToken) {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const user = (await res.json()) as UserSummary;
          set({ user });
        }
      } catch {
        // Sin conexión: se mantienen los tokens guardados y se reintenta más tarde.
      }
    }
  },

  setSession: async (user, accessToken, refreshToken) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
    set({ user, accessToken, refreshToken });
  },

  setUser: (user) => set({ user }),

  refreshTokens: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      await Promise.all([
        SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.accessToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken),
      ]);
      set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return true;
    } catch {
      return false;
    }
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
