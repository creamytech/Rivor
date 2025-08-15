import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { runOrgHealthProbes } from '@/server/health-probes';
import { getTokenEncryptionStatus } from '@/server/secure-tokens';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!(session as any)?.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all email accounts for the org
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId: (session as any).orgId },
      select: {
        id: true,
        provider: true,
        email: true,
        displayName: true,
        status: true,
        syncStatus: true,
        lastSyncedAt: true,
        encryptionStatus: true,
        errorReason: true,
        kmsErrorCode: true,
        kmsErrorAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get token encryption statistics
    const tokenStats = await getTokenEncryptionStatus((session as any).orgId);

    // Run health probes if requested
    const runProbes = req.nextUrl.searchParams.get('probe') === 'true';
    let healthProbeResults = null;

    if (runProbes) {
      healthProbeResults = await runOrgHealthProbes((session as any).orgId);
    }

    // Calculate overall integration status
    const totalAccounts = emailAccounts.length;
    const connectedAccounts = emailAccounts.filter(acc => acc.status === 'connected').length;
    const actionNeededAccounts = emailAccounts.filter(acc => acc.status === 'action_needed').length;
    const disconnectedAccounts = emailAccounts.filter(acc => acc.status === 'disconnected').length;

    const overallStatus = totalAccounts === 0 ? 'none' :
      connectedAccounts === totalAccounts ? 'all_connected' :
      actionNeededAccounts > 0 || disconnectedAccounts > 0 ? 'issues_present' :
      'partial';

    return NextResponse.json({
      overallStatus,
      summary: {
        totalAccounts,
        connectedAccounts,
        actionNeededAccounts,
        disconnectedAccounts,
      },
      emailAccounts: emailAccounts.map(account => ({
        ...account,
        // Determine specific status for UI
        uiStatus: determineUIStatus(account),
        requiresRetry: account.encryptionStatus === 'failed',
        canReconnect: account.status === 'action_needed' || account.status === 'disconnected',
      })),
      tokenEncryption: tokenStats,
      healthProbes: healthProbeResults,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Integration status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Determines the UI status based on account state
 */
function determineUIStatus(account: any): string {
  // Connected = status='connected' and recent health probe success
  if (account.status === 'connected' && account.encryptionStatus === 'ok') {
    return 'connected';
  }

  // Action Needed if any of:
  if (account.encryptionStatus === 'failed') {
    return 'encryption_failed';
  }

  if (!account.tokenRef) {
    return 'missing_tokens';
  }

  if (account.status === 'action_needed') {
    if (account.errorReason?.includes('probe')) {
      return 'probe_failed';
    }
    if (account.errorReason?.includes('scope')) {
      return 'insufficient_scopes';
    }
    return 'action_needed';
  }

  if (account.status === 'disconnected') {
    return 'disconnected';
  }

  return 'unknown';
}
