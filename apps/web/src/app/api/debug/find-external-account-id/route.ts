import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { decryptForOrg } from '@/server/crypto';
import { logger } from '@/lib/logger';

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

    // Get email account to find externalAccountId
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        orgId,
        provider: 'google'
      }
    });

    if (!emailAccount) {
      return NextResponse.json({ error: 'No Google email account found' }, { status: 404 });
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
      // Try different possible externalAccountId values
      const possibleExternalAccountIds = [
        emailAccount.externalAccountId,
        emailAccount.email,
        emailAccount.id,
        session.user.email,
        'benjaminscott18@gmail.com', // Hardcoded for testing
        'google',
        'default'
      ];

      const decryptionResults = [];

      for (const externalAccountId of possibleExternalAccountIds) {
        if (!externalAccountId) continue;

        try {
          const context = token.tokenType === 'oauth_access' 
            ? `oauth:access:${externalAccountId}`
            : `oauth:refresh:${externalAccountId}`;
          
          const decryptedBytes = await decryptForOrg(
            orgId,
            token.encryptedTokenBlob,
            context
          );
          
          const decryptedToken = new TextDecoder().decode(decryptedBytes);
          
          decryptionResults.push({
            externalAccountId,
            success: true,
            decryptedPreview: decryptedToken.substring(0, 20) + '...',
            context
          });
        } catch (error) {
          decryptionResults.push({
            externalAccountId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            context: token.tokenType === 'oauth_access' 
              ? `oauth:access:${externalAccountId}`
              : `oauth:refresh:${externalAccountId}`
          });
        }
      }

      results.push({
        tokenId: token.id,
        tokenType: token.tokenType,
        tokenRef: token.tokenRef,
        createdAt: token.createdAt,
        encryptedBlobLength: token.encryptedTokenBlob?.length || 0,
        decryptionAttempts: decryptionResults
      });
    }

    return NextResponse.json({
      success: true,
      orgId,
      emailAccount: {
        id: emailAccount.id,
        email: emailAccount.email,
        externalAccountId: emailAccount.externalAccountId,
        provider: emailAccount.provider
      },
      totalTokens: secureTokens.length,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error finding external account ID', { error });
    return NextResponse.json(
      { error: 'Failed to find external account ID' },
      { status: 500 }
    );
  }
}
