import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { enqueueTokenEncryption } from '@/server/queue-jobs';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session as any)?.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { emailAccountId, originalTokens } = await req.json();

    if (!emailAccountId) {
      return NextResponse.json(
        { error: 'emailAccountId is required' },
        { status: 400 }
      );
    }

    // Verify the email account belongs to the user's org
    const emailAccount = await prisma.emailAccount.findFirst({
              where: {
          id: emailAccountId,
          orgId: (session as any).orgId,
        },
      include: {
        org: true,
      },
    });

    if (!emailAccount) {
      return NextResponse.json(
        { error: 'EmailAccount not found' },
        { status: 404 }
      );
    }

    // Check if retry is needed
    if (emailAccount.encryptionStatus === 'ok') {
      return NextResponse.json(
        { error: 'Email account encryption is already successful' },
        { status: 400 }
      );
    }

    // Get failed tokens from SecureToken table
    const failedTokens = await prisma.secureToken.findMany({
      where: {
        orgId: (session as any).orgId,
        provider: emailAccount.provider,
        encryptionStatus: 'failed',
      },
    });

    if (failedTokens.length === 0) {
      return NextResponse.json(
        { error: 'No failed tokens found to retry' },
        { status: 400 }
      );
    }

    // For security, we need the original tokens to be provided
    // In a real implementation, you might get these from a secure OAuth re-flow
    if (!originalTokens || (!originalTokens.accessToken && !originalTokens.refreshToken)) {
      return NextResponse.json(
        { error: 'Original tokens required for retry' },
        { status: 400 }
      );
    }

    // Enqueue token encryption retry jobs
    const retryPromises = failedTokens.map(token => {
      const originalToken = token.tokenType === 'oauth_access' 
        ? originalTokens.accessToken
        : originalTokens.refreshToken;

      if (!originalToken) return Promise.resolve();

      return enqueueTokenEncryption({
        orgId: (session as any).orgId,
        emailAccountId,
        tokenRef: token.tokenRef,
        originalToken,
        provider: emailAccount.provider,
        externalAccountId: emailAccount.externalAccountId,
      });
    });

    await Promise.all(retryPromises);

    // Update EmailAccount status to pending
    await prisma.emailAccount.update({
      where: { id: emailAccountId },
      data: {
        encryptionStatus: 'pending',
        kmsErrorCode: null,
        kmsErrorAt: null,
      },
    });

    logger.info('Token encryption retry initiated', {
      orgId: (session as any).orgId,
      emailAccountId,
      provider: emailAccount.provider,
      failedTokenCount: failedTokens.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Token encryption retry jobs enqueued',
      retryCount: failedTokens.length,
    });

  } catch (error: any) {
    logger.error('Token encryption retry failed', {
      error: error?.message || error,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
