import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Testing OAuth flow and encrypted tokens...');
    
    // Get current session
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        message: 'Please sign in first'
      });
    }

    // Find user and their accounts
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          select: {
            id: true,
            provider: true,
            providerAccountId: true,
            access_token_enc: true,
            refresh_token_enc: true,
            id_token_enc: true,
            expires_at: true,
            scope: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database'
      });
    }

    // Check if we have encrypted tokens
    const accountsWithTokens = user.accounts.map(account => ({
      ...account,
      hasAccessToken: !!account.access_token_enc,
      hasRefreshToken: !!account.refresh_token_enc,
      hasIdToken: !!account.id_token_enc,
      tokenSizes: {
        access: account.access_token_enc?.length || 0,
        refresh: account.refresh_token_enc?.length || 0,
        id: account.id_token_enc?.length || 0
      }
    }));

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      accounts: accountsWithTokens,
      summary: {
        totalAccounts: user.accounts.length,
        accountsWithTokens: accountsWithTokens.filter(a => a.hasAccessToken).length,
        encryptionWorking: accountsWithTokens.some(a => a.hasAccessToken && a.tokenSizes.access > 0)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ OAuth test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}