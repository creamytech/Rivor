import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { decryptForOrg } from '@/server/crypto';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get orgId from session or database
    let orgId = session.user.orgId;
    if (!orgId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { orgMembers: { include: { org: true } } }
      });
      orgId = user?.orgMembers?.[0]?.org?.id;
    }

    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Get all secure tokens for this org
    const secureTokens = await prisma.secureToken.findMany({
      where: {
        orgId,
        provider: 'google',
        encryptionStatus: 'ok'
      },
      orderBy: { createdAt: 'asc' }
    });

    const results = [];

    for (const token of secureTokens) {
      const tokenRefParts = token.tokenRef.split('-');
      
      // Try different parsing strategies
      const parsingStrategies = [
        {
          name: 'Last part',
          externalAccountId: tokenRefParts[tokenRefParts.length - 1]
        },
        {
          name: 'Second to last part',
          externalAccountId: tokenRefParts[tokenRefParts.length - 2]
        },
        {
          name: 'Third to last part',
          externalAccountId: tokenRefParts[tokenRefParts.length - 3]
        },
        {
          name: 'Fourth to last part',
          externalAccountId: tokenRefParts[tokenRefParts.length - 4]
        }
      ];

      const decryptionResults = [];

      for (const strategy of parsingStrategies) {
        try {
          const context = token.tokenType === 'oauth_access' 
            ? `oauth:access:${strategy.externalAccountId}`
            : `oauth:refresh:${strategy.externalAccountId}`;
          
          const decryptedBytes = await decryptForOrg(
            orgId,
            token.encryptedTokenBlob,
            context
          );
          
          const decryptedToken = new TextDecoder().decode(decryptedBytes);
          
          decryptionResults.push({
            strategy: strategy.name,
            externalAccountId: strategy.externalAccountId,
            success: true,
            decryptedPreview: decryptedToken.substring(0, 20) + '...',
            context
          });
        } catch (error) {
          decryptionResults.push({
            strategy: strategy.name,
            externalAccountId: strategy.externalAccountId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            context: token.tokenType === 'oauth_access' 
              ? `oauth:access:${strategy.externalAccountId}`
              : `oauth:refresh:${strategy.externalAccountId}`
          });
        }
      }

      results.push({
        tokenId: token.id,
        tokenType: token.tokenType,
        tokenRef: token.tokenRef,
        tokenRefParts,
        createdAt: token.createdAt,
        updatedAt: token.updatedAt,
        encryptedBlobLength: token.encryptedTokenBlob?.length || 0,
        parsingStrategies: decryptionResults
      });
    }

    return NextResponse.json({
      success: true,
      orgId,
      totalTokens: secureTokens.length,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error inspecting token references', { error });
    return NextResponse.json(
      { error: 'Failed to inspect token references' },
      { status: 500 }
    );
  }
}
