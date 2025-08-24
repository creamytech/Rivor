import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    return NextResponse.json({
      success: true,
      authStrategy: 'jwt', // Currently using JWT strategy
      session: {
        hasSession: !!session,
        user: session?.user ? {
          email: session.user.email,
          name: session.user.name,
          image: session.user.image
        } : null,
        expires: session?.expires,
      },
      issues: {
        jwtStrategy: {
          problem: 'JWT strategy only provides account data on first sign-in',
          solution: 'Switch to database strategy for persistent OAuth tokens',
          impact: 'Account records not created, causing sync failures'
        },
        currentBehavior: {
          testUserFallback: 'App falls back to demo/test mode when JWT fails',
          multipleRefreshesNeeded: 'Session persistence issues with JWT tokens',
          noOAuthTokenPersistence: 'OAuth tokens not stored in database'
        }
      },
      recommendations: [
        'Switch to database session strategy',
        'Remove JWT-only auth logic',
        'Ensure proper Account record creation'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Auth strategy check error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}