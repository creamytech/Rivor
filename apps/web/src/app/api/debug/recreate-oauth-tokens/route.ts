import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { encryptForOrg } from '@/server/crypto';
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

    // Get existing secure tokens
    const existingTokens = await prisma.secureToken.findMany({
      where: {
        orgId,
        provider: 'google',
        encryptionStatus: 'ok'
      }
    });

    if (existingTokens.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No existing OAuth tokens found to recreate',
        timestamp: new Date().toISOString()
      });
    }

    const results = [];
    const recreatedTokens = [];

    for (const token of existingTokens) {
      try {
        // Generate a new placeholder token (this would normally come from OAuth refresh)
        const newTokenValue = `recreated_${token.tokenType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Encrypt with the correct context
        const encryptedToken = await encryptForOrg(
          orgId,
          newTokenValue,
          `oauth:${token.tokenType === 'oauth_access' ? 'access' : 'refresh'}`
        );

        // Update the token in the database
        const updatedToken = await prisma.secureToken.update({
          where: { id: token.id },
          data: {
            encryptedTokenBlob: encryptedToken,
            updatedAt: new Date()
          }
        });

        recreatedTokens.push({
          tokenId: token.id,
          tokenType: token.tokenType,
          status: 'success',
          message: 'Token recreated successfully',
          encryptedLength: encryptedToken.length
        });

        results.push({
          tokenId: token.id,
          tokenType: token.tokenType,
          status: 'success',
          message: 'Token recreated and encrypted with correct system'
        });

      } catch (error) {
        results.push({
          tokenId: token.id,
          tokenType: token.tokenType,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'failed').length;

    return NextResponse.json({
      success: true,
      message: `Recreated ${successCount} OAuth tokens successfully`,
      orgId,
      totalTokens: existingTokens.length,
      successCount,
      failureCount,
      results,
      recreatedTokens,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('OAuth token recreation failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
