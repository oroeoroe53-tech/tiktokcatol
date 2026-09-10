import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BibleBookSummary, BibleVerseSummary } from '@faro/types';
import { api } from '../services/api-client';

export function useBibleBooks() {
  return useQuery({
    queryKey: ['bible', 'books'],
    queryFn: () => api.get<BibleBookSummary[]>('/bible/books?language=es', { auth: false }),
  });
}

export function useBibleChapter(bookId: string | undefined, chapterNumber: number | undefined) {
  return useQuery({
    queryKey: ['bible', 'chapter', bookId, chapterNumber],
    queryFn: () =>
      api.get<BibleVerseSummary[]>(`/bible/books/${bookId}/chapters/${chapterNumber}`, {
        auth: false,
      }),
    enabled: !!bookId && !!chapterNumber,
  });
}

export function useGospelOfTheDay() {
  return useQuery({
    queryKey: ['bible', 'gospel-of-the-day'],
    queryFn: () =>
      api.get<BibleVerseSummary[]>('/bible/gospel-of-the-day?language=es', { auth: false }),
  });
}

export function useBibleSearch(query: string) {
  return useQuery({
    queryKey: ['bible', 'search', query],
    queryFn: () => api.get<BibleVerseSummary[]>(`/bible/search?q=${encodeURIComponent(query)}&language=es`, { auth: false }),
    enabled: query.trim().length > 2,
  });
}

export function useToggleFavoriteVerse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ verseId, favorite }: { verseId: string; favorite: boolean }) =>
      favorite ? api.post(`/bible/verses/${verseId}/favorite`) : api.delete(`/bible/verses/${verseId}/favorite`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bible', 'favorites'] }),
  });
}

export function useSaintOfTheDay() {
  return useQuery({
    queryKey: ['saints', 'today'],
    queryFn: () => api.get('/saints/today?language=es', { auth: false }),
  });
}
