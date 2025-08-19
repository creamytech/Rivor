export type Env = {
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
  APP_URL?: string;
  APP_BRAND_NAME: string;
  DEFAULT_TIMEZONE: string;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_PROJECT_ID?: string;
  GOOGLE_PUBSUB_TOPIC?: string;
  GOOGLE_PUBSUB_VERIFICATION_TOKEN?: string;
  GOOGLE_OAUTH_SCOPES?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  MICROSOFT_TENANT_ID: string;
  MICROSOFT_OAUTH_SCOPES?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_PRO_MONTH?: string;
  SENTRY_DSN?: string;
  POSTHOG_API_KEY?: string;
  POSTHOG_HOST?: string;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  MLS_API_KEY?: string;
  AI_API_KEY?: string;
  KMS_PROVIDER?: 'gcp'|'aws'|'azure';
  KMS_KEY_ID?: string;
  ENCRYPTION_CACHE_TTL_SECONDS: number;
  EPHEMERAL_STORAGE_MODE: boolean;
  RETENTION_DAYS: number;
  SHOW_DEMO_DATA: boolean;
};

export function getEnv(): Env {
  const env = process.env;
  return {
    NEXTAUTH_URL: env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
    APP_URL: env.APP_URL,
    APP_BRAND_NAME: env.APP_BRAND_NAME ?? 'Rivor',
    DEFAULT_TIMEZONE: env.DEFAULT_TIMEZONE ?? 'America/New_York',
    DATABASE_URL: env.DATABASE_URL,
    REDIS_URL: env.REDIS_URL,
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
    GOOGLE_PROJECT_ID: env.GOOGLE_PROJECT_ID,
    GOOGLE_PUBSUB_TOPIC: env.GOOGLE_PUBSUB_TOPIC,
    GOOGLE_PUBSUB_VERIFICATION_TOKEN: env.GOOGLE_PUBSUB_VERIFICATION_TOKEN,
    GOOGLE_OAUTH_SCOPES: env.GOOGLE_OAUTH_SCOPES,
    MICROSOFT_CLIENT_ID: env.MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET: env.MICROSOFT_CLIENT_SECRET,
    MICROSOFT_TENANT_ID: env.MICROSOFT_TENANT_ID ?? 'common',
    MICROSOFT_OAUTH_SCOPES: env.MICROSOFT_OAUTH_SCOPES,
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_PRO_MONTH: env.STRIPE_PRICE_PRO_MONTH,
    SENTRY_DSN: env.SENTRY_DSN,
    POSTHOG_API_KEY: env.POSTHOG_API_KEY,
    POSTHOG_HOST: env.POSTHOG_HOST,
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    OPENAI_BASE_URL: env.OPENAI_BASE_URL,
    MLS_API_KEY: env.MLS_API_KEY,
    AI_API_KEY: env.AI_API_KEY,
    KMS_PROVIDER: env.KMS_PROVIDER as Env['KMS_PROVIDER'],
    KMS_KEY_ID: env.KMS_KEY_ID,
    ENCRYPTION_CACHE_TTL_SECONDS: Number(env.ENCRYPTION_CACHE_TTL_SECONDS ?? 60),
    EPHEMERAL_STORAGE_MODE: String(env.EPHEMERAL_STORAGE_MODE ?? 'false') === 'true',
    RETENTION_DAYS: Number(env.RETENTION_DAYS ?? 90),
    SHOW_DEMO_DATA: String(env.SHOW_DEMO_DATA ?? 'false') === 'true',
  };
}

/**
 * Performs startup configuration validation and logging
 */
export function validateAndLogStartupConfig(): void {
  const env = getEnv();
  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Critical variables check
  if (!env.NEXTAUTH_URL) missingVars.push('NEXTAUTH_URL');
  if (!env.NEXTAUTH_SECRET) missingVars.push('NEXTAUTH_SECRET');
  if (!env.DATABASE_URL) missingVars.push('DATABASE_URL');

  // Google OAuth check
  if (!env.GOOGLE_CLIENT_ID && !env.MICROSOFT_CLIENT_ID) {
    missingVars.push('GOOGLE_CLIENT_ID or MICROSOFT_CLIENT_ID');
  }
  if (!env.GOOGLE_CLIENT_SECRET && !env.MICROSOFT_CLIENT_SECRET) {
    missingVars.push('GOOGLE_CLIENT_SECRET or MICROSOFT_CLIENT_SECRET');
  }

  // Google project check for Pub/Sub
  if (env.GOOGLE_CLIENT_ID && !env.GOOGLE_PROJECT_ID) {
    warnings.push('GOOGLE_PROJECT_ID missing - Pub/Sub notifications may not work');
  }
  if (env.GOOGLE_PROJECT_ID && !env.GOOGLE_PUBSUB_TOPIC) {
    warnings.push('GOOGLE_PUBSUB_TOPIC missing - real-time sync disabled');
  }
  if (env.GOOGLE_PUBSUB_TOPIC && !env.GOOGLE_PUBSUB_VERIFICATION_TOKEN) {
    warnings.push('GOOGLE_PUBSUB_VERIFICATION_TOKEN missing - push endpoint vulnerable');
  }

  // Log fatal misconfigurations
  if (missingVars.length > 0) {
    console.error('🔴 FATAL MISCONFIG - Missing required environment variables:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    console.error('Application may not function correctly');
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Extract DB hostname safely
  let dbHost = 'unknown';
  try {
    if (env.DATABASE_URL) {
      const dbUrl = new URL(env.DATABASE_URL);
      dbHost = dbUrl.hostname;
      // Also log the first 40 characters for verification
      console.log(`📊 DB URL prefix: ${env.DATABASE_URL.slice(0, 40)}...`);
    }
  } catch (err) {
    console.warn('Could not parse DATABASE_URL hostname');
  }

  // Log startup banner with masked DB host for security
  const kmsStatus = env.KMS_PROVIDER && env.KMS_KEY_ID ? 'on' : 'off';
  const maskedDbHost = dbHost.length > 4 ? dbHost.slice(0, 4) + '***' : '***';
  console.log(`🚀 Rivor startup: DB host: ${maskedDbHost} | KMS: ${kmsStatus} | NEXTAUTH_URL: ${env.NEXTAUTH_URL} | Project: ${env.GOOGLE_PROJECT_ID || 'not set'} | Demo: ${env.SHOW_DEMO_DATA ? 'on' : 'off'}`);
}


