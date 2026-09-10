import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserProfile } from '@faro/types';
import type { UpdatePreferencesInput } from '@faro/validation';
import { api } from '../services/api-client';
import { useAuthStore } from '../stores/auth-store';

export function useMyProfile() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.get<UserProfile>('/users/me'),
    enabled: !!user,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePreferencesInput) => api.patch('/users/me/preferences', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', 'me', 'preferences'] }),
  });
}

export function useCompleteOnboarding() {
  return useMutation({
    mutationFn: () => api.patch('/users/me/onboarding/complete'),
  });
}

export function useUserVideos(creatorId?: string) {
  return useQuery({
    queryKey: ['videos', 'by-creator', creatorId],
    queryFn: () => api.get(`/videos/by/${creatorId}`, { auth: false }),
    enabled: !!creatorId,
  });
}

export function useMyNotifications() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications'),
    enabled: !!user,
  });
}
