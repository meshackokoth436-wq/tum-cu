import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_PREFIX: z.string().default('/api/v1'),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('tecump'),
  DB_PASSWORD: z.string().default('change_me'),
  DB_NAME: z.string().default('tecump'),
  DB_CONNECTION_LIMIT: z.coerce.number().default(10),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().default('development-access-secret-change-this-please-32chars'),
  JWT_REFRESH_SECRET: z.string().default('development-refresh-secret-change-this-please-32chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(3000),

  // All optional: if SMTP_HOST is unset, the notification dispatcher logs
  // emails to the console instead of sending them — safe default for local
  // development, but every queued notification still gets processed and
  // marked sent so nothing silently piles up unsent.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('TUMCU Christian Union <no-reply@tumcu.ac.ke>'),
  NOTIFICATION_DISPATCH_INTERVAL_MS: z.coerce.number().default(30000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast: an invalid/missing configuration must never reach runtime.
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const config = parsed.data;

if (config.NODE_ENV === 'production') {
  const origins = config.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (origins.length === 0 || origins.includes('*')) {
    console.error('❌ CORS_ORIGIN must contain explicit HTTPS origins in production; wildcard is forbidden.');
    process.exit(1);
  }
  if (origins.some((origin) => !origin.startsWith('https://'))) {
    console.error('❌ Production CORS_ORIGIN entries must use HTTPS.');
    process.exit(1);
  }
  const forbidden = new Set(['change_me', 'development-access-secret-change-this-please-32chars', 'development-refresh-secret-change-this-please-32chars']);
  if (forbidden.has(config.DB_PASSWORD) || forbidden.has(config.JWT_ACCESS_SECRET) || forbidden.has(config.JWT_REFRESH_SECRET) || config.JWT_ACCESS_SECRET.length < 32 || config.JWT_REFRESH_SECRET.length < 32) {
    console.error('❌ Production secrets contain development/default values or are too short.');
    process.exit(1);
  }
  if (config.JWT_ACCESS_SECRET === config.JWT_REFRESH_SECRET) {
    console.error('❌ JWT access and refresh secrets must be different in production.');
    process.exit(1);
  }
}

export const env = config;
