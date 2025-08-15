import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to check environment variables
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check critical environment variables (without exposing sensitive values)
    const envCheck = {
      // Database
      DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
      
      // NextAuth
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
      
      // Google OAuth
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID || 'not set',
      
      // KMS Configuration
      KMS_PROVIDER: process.env.KMS_PROVIDER || 'not set',
      KMS_KEY_ID: process.env.KMS_KEY_ID || 'not set',
      KMS_KEY_ID_format: process.env.KMS_KEY_ID?.includes('projects/') ? 'correct' : 'incorrect',
      
      // Google Cloud Auth
      GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      GOOGLE_APPLICATION_CREDENTIALS_JSON: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      GOOGLE_APPLICATION_CREDENTIALS_JSON_length: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.length || 0,
      
      // Runtime info
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    };

    // Test KMS setup
    let kmsTest = 'not tested';
    try {
      const { getEnv } = await import('@/server/env');
      const env = getEnv();
      kmsTest = env.KMS_PROVIDER && env.KMS_KEY_ID ? 'configured' : 'missing';
    } catch (error) {
      kmsTest = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }

    return NextResponse.json({
      environment: envCheck,
      kmsTest,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Environment check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check environment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
