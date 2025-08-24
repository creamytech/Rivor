import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logOAuth } from '@/lib/oauth-logger';

export async function GET(req: NextRequest) {
  try {
    logOAuth('info', '🔍 Checking session state after OAuth');
    
    // Get current session from NextAuth
    const session = await auth();
    
    // Check database for user and sessions
    const user = await prisma.user.findUnique({
      where: { email: 'benjaminscott18@gmail.com' },
      include: {
        accounts: {
          select: {
            id: true,
            provider: true,
            access_token_enc: true,
            refresh_token_enc: true,
            expires_at: true,
            createdAt: true
          }
        },
        sessions: {
          select: {
            id: true,
            sessionToken: true,
            expires: true,
            createdAt: true
          }
        }
      }
    });

    const sessionAnalysis = {
      nextAuthSession: {
        exists: !!session,
        user: session?.user || null,
        expires: session?.expires || null
      },
      database: {
        userExists: !!user,
        userId: user?.id || null,
        accountCount: user?.accounts?.length || 0,
        sessionCount: user?.sessions?.length || 0,
        accounts: user?.accounts?.map(acc => ({
          id: acc.id,
          provider: acc.provider,
          hasTokens: !!acc.access_token_enc,
          expires: acc.expires_at,
          created: acc.createdAt
        })) || [],
        sessions: user?.sessions?.map(sess => ({
          id: sess.id,
          expires: sess.expires,
          expired: sess.expires < new Date(),
          created: sess.createdAt,
          tokenPreview: sess.sessionToken.substring(0, 10) + '...'
        })) || []
      },
      diagnosis: {
        hasValidSession: !!session && session.expires && new Date(session.expires) > new Date(),
        hasUser: !!user,
        hasAccount: (user?.accounts?.length || 0) > 0,
        hasActiveDbSession: (user?.sessions?.filter(s => s.expires > new Date())?.length || 0) > 0,
        possibleIssues: []
      }
    };

    // Add diagnostic information
    if (!session) {
      sessionAnalysis.diagnosis.possibleIssues.push('No NextAuth session found');
    }
    if (!user) {
      sessionAnalysis.diagnosis.possibleIssues.push('User not found in database');
    }
    if (user && user.accounts.length === 0) {
      sessionAnalysis.diagnosis.possibleIssues.push('User has no linked accounts');
    }
    if (user && user.sessions.length === 0) {
      sessionAnalysis.diagnosis.possibleIssues.push('User has no database sessions');
    }
    if (user && user.sessions.every(s => s.expires < new Date())) {
      sessionAnalysis.diagnosis.possibleIssues.push('All database sessions are expired');
    }

    logOAuth('info', '📊 Session analysis complete', sessionAnalysis);

    return NextResponse.json({
      success: true,
      ...sessionAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logOAuth('error', '❌ Session check failed', { 
      error: error instanceof Error ? error.message : error 
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}