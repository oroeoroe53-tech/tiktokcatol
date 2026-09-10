import { z } from 'zod';
import { ReportReason, ReportTargetType, VerificationType } from '@faro/types';

export const createReportSchema = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetId: z.string().uuid(),
  reason: z.nativeEnum(ReportReason),
  description: z.string().max(1000).optional(),
});
export type CreateReportInput = z.infer<typeof createReportSchema>;

export const createPrayerIntentionSchema = z.object({
  text: z.string().min(1).max(500),
  isAnonymous: z.boolean().default(false),
});
export type CreatePrayerIntentionInput = z.infer<typeof createPrayerIntentionSchema>;

export const createVerificationRequestSchema = z.object({
  type: z.nativeEnum(VerificationType),
  legalName: z.string().min(2).max(120),
  organization: z.string().max(120).optional(),
  documentUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateVerificationRequestInput = z.infer<typeof createVerificationRequestSchema>;
