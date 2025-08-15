import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Public debug endpoint to check OAuth providers configuration
 * No authentication required
 */
export async function GET(_req: NextRequest) {
  try {
    // Check environment variables
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const googleProjectId = process.env.GOOGLE_PROJECT_ID;
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;

    // Check what providers would be loaded
    const providers = [];
    
    if (googleClientId && googleClientSecret) {
      providers.push('google');
    }
    
    if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
      providers.push('microsoft');
    }

    return NextResponse.json({
      providersConfigured: providers,
      environmentCheck: {
        GOOGLE_CLIENT_ID: !!googleClientId,
        GOOGLE_CLIENT_SECRET: !!googleClientSecret,
        GOOGLE_PROJECT_ID: !!googleProjectId,
        NEXTAUTH_URL: nextAuthUrl || 'not set',
        NEXTAUTH_SECRET: !!nextAuthSecret,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV
      },
      googleClientIdLength: googleClientId?.length || 0,
      googleClientSecretLength: googleClientSecret?.length || 0,
      providersLength: providers.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { 
        error: 'Failed to check providers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
