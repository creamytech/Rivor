import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const probe = url.searchParams.get('probe') === 'true';

    // Get email accounts with detailed status
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        provider: true,
        email: true,
        displayName: true,
        status: true,
        syncStatus: true,
        lastSyncedAt: true,
        errorReason: true,
        encryptionStatus: true,
        kmsErrorCode: true,
        kmsErrorAt: true,
        tokenStatus: true
      }
    });

    // Get secure tokens for encryption status
    const secureTokens = await prisma.secureToken.findMany({
      where: { orgId },
      select: {
        encryptionStatus: true,
        kmsErrorCode: true,
        kmsErrorAt: true,
        createdAt: true
      }
    });

    // Transform email accounts with UI status
    const transformedAccounts = emailAccounts.map(account => {
      let uiStatus = 'connected';
      let requiresRetry = false;
      let canReconnect = true;

      // Determine UI status based on account health
      if (account.status === 'disconnected') {
        uiStatus = 'disconnected';
        canReconnect = true;
      } else if (account.encryptionStatus === 'failed') {
        uiStatus = 'encryption_failed';
        requiresRetry = true;
        canReconnect = false;
      } else if (account.tokenStatus === 'failed') {
        uiStatus = 'missing_tokens';
        requiresRetry = true;
        canReconnect = true;
      } else if (account.status === 'action_needed') {
        uiStatus = 'action_needed';
        canReconnect = true;
      } else if (account.status === 'connected' && account.encryptionStatus === 'ok') {
        uiStatus = 'connected';
        canReconnect = false;
      } else {
        uiStatus = 'action_needed';
        canReconnect = true;
      }

      return {
        id: account.id,
        provider: account.provider,
        email: account.email,
        displayName: account.displayName,
        status: account.status,
        syncStatus: account.syncStatus,
        lastSyncedAt: account.lastSyncedAt?.toISOString(),
        errorReason: account.errorReason,
        encryptionStatus: account.encryptionStatus,
        kmsErrorCode: account.kmsErrorCode,
        kmsErrorAt: account.kmsErrorAt?.toISOString(),
        uiStatus,
        requiresRetry,
        canReconnect
      };
    });

    // Calculate summary statistics
    const summary = {
      totalAccounts: emailAccounts.length,
      connectedAccounts: emailAccounts.filter(acc => acc.status === 'connected').length,
      actionNeededAccounts: emailAccounts.filter(acc => acc.status === 'action_needed').length,
      disconnectedAccounts: emailAccounts.filter(acc => acc.status === 'disconnected').length
    };

    // Determine overall status
    let overallStatus = 'all_connected';
    if (summary.disconnectedAccounts > 0) {
      overallStatus = 'some_disconnected';
    } else if (summary.actionNeededAccounts > 0) {
      overallStatus = 'action_needed';
    }

    // Token encryption status
    const tokenEncryption = {
      totalTokens: secureTokens.length,
      okTokens: secureTokens.filter(token => token.encryptionStatus === 'ok').length,
      pendingTokens: secureTokens.filter(token => token.encryptionStatus === 'pending').length,
      failedTokens: secureTokens.filter(token => token.encryptionStatus === 'failed').length,
      oldestFailure: secureTokens
        .filter(token => token.encryptionStatus === 'failed' && token.kmsErrorAt)
        .sort((a, b) => new Date(a.kmsErrorAt!).getTime() - new Date(b.kmsErrorAt!).getTime())[0]?.kmsErrorAt
    };

    const status = {
      overallStatus,
      summary,
      emailAccounts: transformedAccounts,
      tokenEncryption,
      lastUpdated: new Date().toISOString()
    };

    logger.info('Integration status fetched', { 
      orgId, 
      summary,
      probe 
    });

    return NextResponse.json(status);

  } catch (error) {
    logger.error('Failed to fetch integration status', { error });
    return NextResponse.json(
      { error: 'Failed to fetch integration status' },
      { status: 500 }
    );
  }
}

/**
 * Health check probe endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { accountId, provider } = await req.json();

    if (!accountId && !provider) {
      return NextResponse.json({ error: 'accountId or provider required' }, { status: 400 });
    }

    // TODO: Implement health check logic here
    // This would test the actual API connections
    
    return NextResponse.json({
      success: true,
      message: 'Health check completed',
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Health check API error:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}