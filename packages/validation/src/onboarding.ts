import { z } from 'zod';
import { FaithPathObjective } from '@faro/types';

export const onboardingObjectivesSchema = z.object({
  objective: z.nativeEnum(FaithPathObjective),
});
export type OnboardingObjectivesInput = z.infer<typeof onboardingObjectivesSchema>;

export const onboardingInterestsSchema = z.object({
  interests: z.array(z.string()).min(1).max(10),
});
export type OnboardingInterestsInput = z.infer<typeof onboardingInterestsSchema>;

export const onboardingNotificationsSchema = z.object({
  frequency: z.enum(['DAILY', 'FEW_TIMES_WEEK', 'WEEKLY', 'NEVER']),
  preferredHour: z.number().int().min(0).max(23).optional(),
});
export type OnboardingNotificationsInput = z.infer<typeof onboardingNotificationsSchema>;

export const updatePreferencesSchema = z.object({
  interests: z.array(z.string()).max(20).optional(),
  language: z.enum(['es', 'en']).optional(),
  notificationFrequency: z.enum(['DAILY', 'FEW_TIMES_WEEK', 'WEEKLY', 'NEVER']).optional(),
  notificationHour: z.number().int().min(0).max(23).optional(),
});
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
