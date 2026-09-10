import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FaithPathObjective } from '@faro/types';
import type { FaithPathSummary } from '@faro/types';
import { api, ApiError } from '../services/api-client';
import { useAuthStore } from '../stores/auth-store';

export function useFaithPath() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['faith-path'],
    queryFn: () => api.get<FaithPathSummary>('/faith-path'),
    enabled: !!user,
    retry: (failureCount, error) => !(error instanceof ApiError && error.status === 400) && failureCount < 2,
  });
}

export function useSelectFaithPathObjective() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (objective: FaithPathObjective) =>
      api.patch('/users/me/onboarding/objective', { objective }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faith-path'] }),
  });
}

export function useCompleteFaithPathStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => api.post(`/faith-path/steps/${stepId}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faith-path'] }),
  });
}

export function useChallenges() {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: () => api.get('/challenges'),
  });
}

export function useStartChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) => api.post(`/challenges/${challengeId}/start`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges'] }),
  });
}

export function useCompleteChallengeDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) => api.post(`/challenges/${challengeId}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges'] }),
  });
}
