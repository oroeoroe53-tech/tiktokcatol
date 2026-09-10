import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FeedResponse } from '@faro/types';
import { api } from '../services/api-client';

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      api.get<FeedResponse>(`/feed${pageParam ? `?cursor=${pageParam}` : ''}`, { auth: false }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useLikeVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ videoId, like }: { videoId: string; like: boolean }) =>
      like ? api.post(`/videos/${videoId}/like`) : api.delete(`/videos/${videoId}/like`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useSaveVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ videoId, save }: { videoId: string; save: boolean }) =>
      save ? api.post(`/videos/${videoId}/save`) : api.delete(`/videos/${videoId}/save`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useFollowCreator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, follow }: { userId: string; follow: boolean }) =>
      follow ? api.post(`/users/${userId}/follow`) : api.delete(`/users/${userId}/follow`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useRecordView() {
  return useMutation({
    mutationFn: ({
      videoId,
      watchTimeSeconds,
      completed,
    }: {
      videoId: string;
      watchTimeSeconds: number;
      completed: boolean;
    }) => api.post(`/videos/${videoId}/view`, { watchTimeSeconds, completed }, { auth: false }),
  });
}

export function useMarkNotInterested() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => api.post(`/feed/${videoId}/not-interested`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useReportContent() {
  return useMutation({
    mutationFn: (input: { targetType: string; targetId: string; reason: string; description?: string }) =>
      api.post('/reports', input),
  });
}
