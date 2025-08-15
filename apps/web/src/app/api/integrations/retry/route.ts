import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { retryFailedTokenEncryption } from '@/server/secure-tokens';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Retry failed token encryption endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { emailAccountId, tokenRef } = await req.json();

    if (!emailAccountId && !tokenRef) {
      return NextResponse.json({ 
        error: 'emailAccountId or tokenRef required' 
      }, { status: 400 });
    }

    // If emailAccountId is provided, find failed tokens for that account
    if (emailAccountId) {
      const emailAccount = await prisma.emailAccount.findFirst({
        where: { 
          id: emailAccountId,
          orgId 
        }
      });

      if (!emailAccount) {
        return NextResponse.json({ 
          error: 'Email account not found' 
        }, { status: 404 });
      }

      // Find failed tokens for this account
      const failedTokens = await prisma.secureToken.findMany({
        where: {
          orgId,
          provider: emailAccount.provider,
          encryptionStatus: 'failed'
        }
      });

      if (failedTokens.length === 0) {
        return NextResponse.json({
          message: 'No failed tokens found for this account',
          success: true
        });
      }

      logger.info('Token encryption retry requested', {
        orgId,
        emailAccountId,
        failedTokenCount: failedTokens.length,
        action: 'token_retry_start'
      });

      // For now, we can't retry without the original tokens
      // In a production system, you would:
      // 1. Force OAuth re-authentication to get fresh tokens
      // 2. Re-encrypt with the fresh tokens
      // 3. Update the secure token records

      return NextResponse.json({
        error: 'Token retry requires OAuth re-authentication',
        message: 'Please reconnect your account to refresh tokens',
        requiresReconnect: true
      }, { status: 400 });
    }

    // If tokenRef is provided, retry that specific token
    if (tokenRef) {
      // This would require the original token value, which we don't have
      return NextResponse.json({
        error: 'Direct token retry not supported',
        message: 'Please reconnect your account to refresh tokens',
        requiresReconnect: true
      }, { status: 400 });
    }

  } catch (error: any) {
    logger.error('Token retry API error', {
      error: error.message,
      action: 'token_retry_failed'
    });
    
    return NextResponse.json(
      { error: 'Token retry failed' },
      { status: 500 }
    );
  }
}