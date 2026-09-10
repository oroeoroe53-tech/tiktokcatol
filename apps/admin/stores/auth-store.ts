import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserSummary } from '@faro/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

interface AuthState {
  user: UserSummary | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: UserSummary, accessToken: string, refreshToken: string) => void;
  refreshTokens: () => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setSession: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),

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
          set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
          return true;
        } catch {
          return false;
        }
      },

      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'faro-admin-auth',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : (undefined as any))),
    },
  ),
);

const ADMIN_ROLES = ['SUPER_ADMIN', 'MODERATOR', 'EDITOR', 'SUPPORT', 'ANALYST'];

export function isAdminRole(role?: string | null): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}
