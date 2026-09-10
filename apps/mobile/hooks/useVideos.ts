import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommentSummary, PaginatedResult } from '@faro/types';
import type { CreateVideoInput } from '@faro/validation';
import { api } from '../services/api-client';

export function useCreateUploadUrl() {
  return useMutation({
    mutationFn: (input: { fileName: string; contentType: string; fileSizeBytes: number }) =>
      api.post<{ videoId: string; storageKey: string; uploadUrl: string }>(
        '/videos/upload-url',
        input,
      ),
  });
}

export function usePublishVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVideoInput) => api.post('/videos', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useComments(videoId: string) {
  return useQuery({
    queryKey: ['comments', videoId],
    queryFn: () => api.get<PaginatedResult<CommentSummary>>(`/videos/${videoId}/comments`, { auth: false }),
    enabled: !!videoId,
  });
}

export function useCreateComment(videoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { text: string; parentId?: string }) =>
      api.post<CommentSummary>(`/videos/${videoId}/comments`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', videoId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
