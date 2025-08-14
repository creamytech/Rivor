import { z } from 'zod';

export const EnvSchema = z.object({
  NEXTAUTH_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  APP_URL: z.string().optional(),
  APP_BRAND_NAME: z.string().default('Rivor'),
  DEFAULT_TIMEZONE: z.string().default('America/New_York'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_PROJECT_ID: z.string().optional(),
  GOOGLE_PUBSUB_TOPIC: z.string().optional(),
  GOOGLE_PUBSUB_VERIFICATION_TOKEN: z.string().optional(),
  GOOGLE_OAUTH_SCOPES: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_TENANT_ID: z.string().default('common'),
  MICROSOFT_OAUTH_SCOPES: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PRO_MONTH: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().optional(),
  KMS_PROVIDER: z.enum(['gcp','aws','azure']).optional(),
  KMS_KEY_ID: z.string().optional(),
  ENCRYPTION_CACHE_TTL_SECONDS: z.coerce.number().default(60),
  EPHEMERAL_STORAGE_MODE: z.coerce.boolean().default(false),
  RETENTION_DAYS: z.coerce.number().default(90)
});

export type Env = z.infer<typeof EnvSchema>;

export function getEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const summary = parsed.error.issues
      .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${summary}`);
  }
  return parsed.data;
}
