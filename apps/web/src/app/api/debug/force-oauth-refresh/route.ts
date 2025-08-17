import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get orgId from database if not in session
    let orgId = session.user.orgId;
    if (!orgId) {
      const org = await prisma.org.findFirst({ 
        where: { name: session.user.email } 
      });
      if (org) {
        orgId = org.id;
      } else {
        return NextResponse.json({
          success: false,
          message: 'No organization found in database',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Delete all existing Google OAuth tokens
    const existingTokens = await prisma.secureToken.findMany({
      where: {
        orgId,
        provider: 'google',
        encryptionStatus: 'ok'
      }
    });

    const deletedTokens = [];
    for (const token of existingTokens) {
      try {
        await prisma.secureToken.delete({
          where: { id: token.id }
        });
        deletedTokens.push({
          tokenId: token.id,
          tokenType: token.tokenType,
          createdAt: token.createdAt
        });
      } catch (error) {
        logger.error(`Failed to delete token ${token.id}:`, error);
      }
    }

    // Generate a fresh OAuth sign-in URL
    const signInUrl = 'https://www.rivor.ai/auth/signin?provider=google&callbackUrl=https://www.rivor.ai/app&force=true';

    return NextResponse.json({
      success: true,
      message: 'All existing OAuth tokens deleted. Please re-authenticate with Google.',
      orgId,
      deletedTokens: deletedTokens.length,
      signInUrl,
      instructions: [
        '1. All existing OAuth tokens have been deleted',
        '2. Click the signInUrl to start a fresh Google OAuth flow',
        '3. Sign in with Google to get new, properly encrypted tokens',
        '4. You will be redirected back to the app dashboard',
        '5. The new tokens will be automatically encrypted with the correct system'
      ],
      note: 'This will force a complete re-authentication and should resolve the invalid_grant error',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Force OAuth refresh failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
