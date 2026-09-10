import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PrayerSummary, PrayerIntentionSummary, PaginatedResult } from '@faro/types';
import { api } from '../services/api-client';

export function useDailyPrayer() {
  return useQuery({
    queryKey: ['prayer', 'daily'],
    queryFn: () => api.get<PrayerSummary>('/prayers/daily?language=es', { auth: false }),
  });
}

export function usePrayers(category?: string) {
  return useQuery({
    queryKey: ['prayers', category ?? 'all'],
    queryFn: () =>
      api.get<PrayerSummary[]>(
        `/prayers?language=es${category ? `&category=${category}` : ''}`,
        { auth: false },
      ),
  });
}

export function useToggleFavoritePrayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ prayerId, favorite }: { prayerId: string; favorite: boolean }) =>
      favorite ? api.post(`/prayers/${prayerId}/favorite`) : api.delete(`/prayers/${prayerId}/favorite`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
      queryClient.invalidateQueries({ queryKey: ['prayer'] });
    },
  });
}

export function useCompletePrayer() {
  return useMutation({
    mutationFn: (prayerId: string) => api.post(`/prayers/${prayerId}/complete`),
  });
}

export function usePrayerIntentions() {
  return useQuery({
    queryKey: ['prayer-intentions'],
    queryFn: () =>
      api.get<PaginatedResult<PrayerIntentionSummary>>('/prayers/intentions', { auth: false }),
  });
}

export function useCreateIntention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { text: string; isAnonymous: boolean }) =>
      api.post<PrayerIntentionSummary>('/prayers/intentions', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prayer-intentions'] }),
  });
}

export function useSupportIntention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ intentionId, praying }: { intentionId: string; praying: boolean }) =>
      praying
        ? api.post(`/prayers/intentions/${intentionId}/pray`)
        : api.delete(`/prayers/intentions/${intentionId}/pray`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['prayer-intentions'] }),
  });
}
