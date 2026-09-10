import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_URL: z.string().url().default('http://localhost:3000'),
  MOBILE_DEEP_LINK_BASE: z.string().default('faro://'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatorio'),
  REDIS_URL: z.string().min(1, 'REDIS_URL es obligatorio'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET debe tener al menos 16 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET debe tener al menos 16 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(30),

  MIN_AGE: z.coerce.number().int().positive().default(13),

  // Object storage (S3-compatible). En local, docker-compose levanta MinIO con estos valores.
  S3_ENDPOINT: z.string().min(1).default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().min(1).default('faro_dev'),
  S3_SECRET_ACCESS_KEY: z.string().min(1).default('faro_dev_secret'),
  S3_BUCKET: z.string().default('faro-videos'),
  S3_PUBLIC_URL: z.string().default('http://localhost:9000/faro-videos'),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),

  // SMTP opcional: si falta, se usa un transporte de desarrollo (consola + storage/dev-outbox)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('Faro <no-reply@faro.app>'),

  // OAuth social: opcionales. Sin credenciales, los endpoints correspondientes quedan deshabilitados (501).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),

  // Push notifications (Expo). Opcional: sin token, las notificaciones solo se registran en BD.
  EXPO_ACCESS_TOKEN: z.string().optional(),

  THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  // Variables opcionales dejadas en blanco en el .env (p. ej. "SMTP_PORT=") deben
  // tratarse como no configuradas, no como cadena vacía / 0.
  const normalized = Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== ''),
  );
  const parsed = envSchema.safeParse(normalized);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuración de entorno inválida:\n${issues}`);
  }
  return parsed.data;
}
