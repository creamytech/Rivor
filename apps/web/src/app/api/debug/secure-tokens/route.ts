import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(__request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const orgId = (session as { orgId?: string }).orgId;

    if (!orgId || orgId === 'unknown') {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // Get user to find correct userId
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all SecureToken records for this org
    const secureTokens = await prisma.secureToken.findMany({
      where: { orgId },
      select: {
        id: true,
        tokenRef: true,
        provider: true,
        tokenType: true,
        encryptionStatus: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        encryptedTokenBlob: true,
      }
    });

    // Get EmailAccount records to see tokenRef values
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        provider: true,
        email: true,
        tokenRef: true,
        tokenStatus: true,
        encryptionStatus: true,
        status: true,
      }
    });

    // Get OAuthAccount records
    const oauthAccounts = await prisma.oAuthAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        provider: true,
        providerId: true,
        scope: true,
        expiresAt: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      userEmail,
      orgId,
      secureTokens: {
        total: secureTokens.length,
        byProvider: secureTokens.reduce((acc, token) => {
          acc[token.provider] = (acc[token.provider] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byType: secureTokens.reduce((acc, token) => {
          acc[token.tokenType] = (acc[token.tokenType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        details: secureTokens
      },
      emailAccounts: {
        total: emailAccounts.length,
        details: emailAccounts
      },
      oauthAccounts: {
        total: oauthAccounts.length,
        details: oauthAccounts
      },
      diagnosis: {
        hasSecureTokens: secureTokens.length > 0,
        hasEmailAccounts: emailAccounts.length > 0,
        hasOAuthAccounts: oauthAccounts.length > 0,
        emailAccountsWithTokenRef: emailAccounts.filter(ea => ea.tokenRef).length,
        secureTokensWithEncryptedBlob: secureTokens.filter(st => st.encryptedTokenBlob).length,
        matchingTokenRefs: emailAccounts.filter(ea => 
          ea.tokenRef && secureTokens.some(st => st.tokenRef === ea.tokenRef)
        ).length
      }
    });
  } catch (error: any) {
    logger.error('Failed to get secure tokens debug info', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: "Failed to get secure tokens debug info", details: error.message }, { status: 500 });
  }
}
