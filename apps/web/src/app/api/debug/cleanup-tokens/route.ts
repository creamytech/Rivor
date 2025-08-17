import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logger } from '@/lib/logger';

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

    // Get all secure tokens for this org
    const allTokens = await prisma.secureToken.findMany({
      where: {
        orgId,
        provider: 'google',
        encryptionStatus: 'ok'
      },
      orderBy: { createdAt: 'asc' }
    });

    if (allTokens.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No tokens found to cleanup',
        timestamp: new Date().toISOString()
      });
    }

    const results = [];
    const deletedTokens = [];

    // Group tokens by type
    const accessTokens = allTokens.filter(t => t.tokenType === 'oauth_access');
    const refreshTokens = allTokens.filter(t => t.tokenType === 'oauth_refresh');

    // Keep only the oldest token of each type (the ones we recreated)
    for (const tokenType of ['oauth_access', 'oauth_refresh']) {
      const tokens = tokenType === 'oauth_access' ? accessTokens : refreshTokens;
      
      if (tokens.length > 1) {
        // Keep the oldest token (our recreated one) and delete the newer ones
        const oldestToken = tokens[0];
        const newerTokens = tokens.slice(1);
        
        for (const tokenToDelete of newerTokens) {
          try {
            await prisma.secureToken.delete({
              where: { id: tokenToDelete.id }
            });
            
            deletedTokens.push({
              tokenId: tokenToDelete.id,
              tokenType: tokenToDelete.tokenType,
              createdAt: tokenToDelete.createdAt,
              reason: 'Duplicate token - keeping oldest'
            });
            
            results.push({
              action: 'deleted',
              tokenId: tokenToDelete.id,
              tokenType: tokenToDelete.tokenType,
              reason: 'Duplicate token removed'
            });
          } catch (error) {
            results.push({
              action: 'failed',
              tokenId: tokenToDelete.id,
              tokenType: tokenToDelete.tokenType,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        
        results.push({
          action: 'kept',
          tokenId: oldestToken.id,
          tokenType: oldestToken.tokenType,
          reason: 'Oldest token kept (properly encrypted)'
        });
      } else if (tokens.length === 1) {
        results.push({
          action: 'kept',
          tokenId: tokens[0].id,
          tokenType: tokens[0].tokenType,
          reason: 'Only token of this type'
        });
      }
    }

    // Get final token count
    const finalTokens = await prisma.secureToken.findMany({
      where: {
        orgId,
        provider: 'google',
        encryptionStatus: 'ok'
      }
    });

    const deletedCount = deletedTokens.length;
    const finalCount = finalTokens.length;

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedCount} duplicate tokens. ${finalCount} tokens remaining.`,
      orgId,
      originalCount: allTokens.length,
      deletedCount,
      finalCount,
      deletedTokens,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Token cleanup failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
