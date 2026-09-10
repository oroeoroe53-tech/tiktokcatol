import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[a-z]/, 'Debe incluir una letra minúscula')
  .regex(/[A-Z]/, 'Debe incluir una letra mayúscula')
  .regex(/[0-9]/, 'Debe incluir un número');

export const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-z0-9._]+$/, 'Solo minúsculas, números, puntos y guiones bajos'),
  displayName: z.string().min(2).max(50),
  password: passwordSchema,
  dateOfBirth: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida'),
  locale: z.enum(['es', 'en']).default('es'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceName: z.string().max(120).optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(10),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const oauthLoginSchema = z.object({
  idToken: z.string().min(10),
  deviceName: z.string().max(120).optional(),
});
export type OAuthLoginInput = z.infer<typeof oauthLoginSchema>;

export const MIN_AGE_DEFAULT = 13;
