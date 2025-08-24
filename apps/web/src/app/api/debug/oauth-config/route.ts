import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    return NextResponse.json({
      success: true,
      config: {
        nextAuthUrl: process.env.NEXTAUTH_URL,
        nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        googleClientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
        googleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        nodeEnv: process.env.NODE_ENV,
        expectedCallbacks: [
          `${baseUrl}/api/auth/callback/google`,
          'https://www.rivor.ai/api/auth/callback/google'
        ],
        currentDomain: req.headers.get('host'),
        userAgent: req.headers.get('user-agent')?.substring(0, 50) + '...'
      },
      troubleshooting: {
        callbackError: {
          possibleCauses: [
            'Callback URL mismatch in Google Console',
            'NEXTAUTH_URL environment variable incorrect',
            'Database connection issues during user creation',
            'Missing required environment variables'
          ],
          solution: 'Check Google OAuth callback URLs match the expectedCallbacks above'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('OAuth config check error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}