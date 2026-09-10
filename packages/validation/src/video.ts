import { z } from 'zod';
import { ContentCategory, VideoVisibility } from '@faro/types';

export const MAX_VIDEO_DURATION_SECONDS = 180;
export const MAX_VIDEO_SIZE_BYTES = 250 * 1024 * 1024;

export const createUploadUrlSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.enum(['video/mp4', 'video/quicktime', 'video/webm']),
  fileSizeBytes: z.number().int().positive().max(MAX_VIDEO_SIZE_BYTES),
});
export type CreateUploadUrlInput = z.infer<typeof createUploadUrlSchema>;

export const createVideoSchema = z.object({
  storageKey: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  category: z.nativeEnum(ContentCategory),
  hashtags: z.array(z.string().max(30)).max(10).default([]),
  language: z.enum(['es', 'en']).default('es'),
  visibility: z.nativeEnum(VideoVisibility).default(VideoVisibility.PUBLIC),
  durationSeconds: z.number().positive().max(MAX_VIDEO_DURATION_SECONDS),
});
export type CreateVideoInput = z.infer<typeof createVideoSchema>;

export const updateVideoSchema = createVideoSchema
  .omit({ storageKey: true, durationSeconds: true })
  .partial();
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;

export const recordViewSchema = z.object({
  watchTimeSeconds: z.number().min(0),
  completed: z.boolean(),
});
export type RecordViewInput = z.infer<typeof recordViewSchema>;

export const createCommentSchema = z.object({
  text: z.string().min(1).max(500),
  parentId: z.string().uuid().optional(),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
