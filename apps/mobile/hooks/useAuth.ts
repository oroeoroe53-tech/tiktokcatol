import { useMutation } from '@tanstack/react-query';
import type { RegisterInput, LoginInput } from '@faro/validation';
import type { UserSummary } from '@faro/types';
import { api, ApiError } from '../services/api-client';
import { useAuthStore } from '../stores/auth-store';

interface AuthResponse {
  user: UserSummary;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api.post<AuthResponse>('/auth/register', input, { auth: false }),
    onSuccess: (data) => setSession(data.user, data.accessToken, data.refreshToken),
  });
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: LoginInput) => api.post<AuthResponse>('/auth/login', input, { auth: false }),
    onSuccess: (data) => setSession(data.user, data.accessToken, data.refreshToken),
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
      }
    },
    onSettled: () => logout(),
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) =>
      api.post('/auth/request-password-reset', { email }, { auth: false }),
  });
}
