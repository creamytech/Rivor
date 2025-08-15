import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(__request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const environment = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
      KMS_PROVIDER: process.env.KMS_PROVIDER,
      KMS_KEY_ID: process.env.KMS_KEY_ID,
      KMS_KEY_ID_format: process.env.KMS_KEY_ID?.includes('projects/') ? 'correct' : 'incorrect',
      GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      GOOGLE_APPLICATION_CREDENTIALS_JSON: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      GOOGLE_APPLICATION_CREDENTIALS_JSON_length: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.length || 0,
      REDIS_URL: !!process.env.REDIS_URL,
      REDIS_URL_length: process.env.REDIS_URL?.length || 0,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    };

    // Test KMS configuration
    let kmsTest = 'not_configured';
    try {
      if (process.env.KMS_PROVIDER && process.env.KMS_KEY_ID) {
        kmsTest = 'configured';
      }
    } catch (error) {
      kmsTest = 'error';
    }

    return NextResponse.json({
      environment,
      kmsTest,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Failed to check environment', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: "Failed to check environment", details: error.message }, { status: 500 });
  }
}
