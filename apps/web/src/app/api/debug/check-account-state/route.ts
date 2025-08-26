import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { logOAuth } from '@/lib/oauth-logger';

export async function GET(req: NextRequest) {
  try {
    logOAuth('info', '🔍 Checking account state for user');
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'benjaminscott18@gmail.com' },
      include: {
        accounts: {
          select: {
            id: true,
            provider: true,
            providerAccountId: true,
            access_token: true,
            refresh_token: true,
            id_token: true,
            expires_at: true,
            createdAt: true,
            updatedAt: true
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

    if (!user) {
      return NextResponse.json({
        success: true,
        found: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check account details
    const accountAnalysis = user.accounts.map(account => ({
      id: account.id,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      hasTokens: {
        access: !!account.access_token,
        refresh: !!account.refresh_token,
        id: !!account.id_token
      },
      tokenSizes: {
        access: account.access_token?.length || 0,
        refresh: account.refresh_token?.length || 0,
        id: account.id_token?.length || 0
      },
      expiresAt: account.expires_at,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt
    }));

    logOAuth('info', '📊 Account state analysis', {
      userId: user.id,
      email: user.email,
      accountCount: user.accounts.length,
      sessionCount: user.sessions.length,
      accounts: accountAnalysis
    });

    return NextResponse.json({
      success: true,
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      accounts: accountAnalysis,
      sessions: user.sessions.map(session => ({
        id: session.id,
        expires: session.expires,
        createdAt: session.createdAt,
        tokenPreview: session.sessionToken.substring(0, 10) + '...'
      })),
      summary: {
        totalAccounts: user.accounts.length,
        googleAccounts: user.accounts.filter(a => a.provider === 'google').length,
        accountsWithTokens: accountAnalysis.filter(a => a.hasTokens.access).length,
        activeSessions: user.sessions.filter(s => s.expires > new Date()).length
      },
      diagnosis: {
        hasUser: true,
        hasGoogleAccount: user.accounts.some(a => a.provider === 'google'),
        hasTokens: accountAnalysis.some(a => a.hasTokens.access),
        whyNoLinkAccount: user.accounts.length > 0 ? 'Account exists - NextAuth skips linkAccount' : 'Should call linkAccount'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logOAuth('error', '❌ Account state check failed', { 
      error: error instanceof Error ? error.message : error 
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}