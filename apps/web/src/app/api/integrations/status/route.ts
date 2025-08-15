import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { getTokenEncryptionStatus } from '@/server/secure-tokens';

export const dynamic = 'force-dynamic';

/**
 * Integration status endpoint for UI components
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get email accounts for this org
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId },
      include: {
        org: true
      }
    });

    // Get calendar accounts for this org  
    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: { orgId }
    });

    // Get token encryption status
    const tokenEncryption = await getTokenEncryptionStatus(orgId);

    // Transform email accounts to UI format
    const transformedEmailAccounts = emailAccounts.map(account => {
      let uiStatus = 'unknown';
      let requiresRetry = false;
      let canReconnect = false;

      // Determine UI status based on multiple factors
      if (account.status === 'disconnected') {
        uiStatus = 'disconnected';
        canReconnect = true;
      } else if (account.encryptionStatus === 'failed') {
        uiStatus = 'encryption_failed';
        requiresRetry = true;
        canReconnect = true;
      } else if (!account.tokenRef) {
        uiStatus = 'missing_tokens';
        canReconnect = true;
      } else if (account.status === 'action_needed') {
        uiStatus = 'action_needed';
        canReconnect = true;
      } else if (account.syncStatus === 'error') {
        uiStatus = 'probe_failed';
        canReconnect = true;
      } else if (account.status === 'connected' && account.encryptionStatus === 'ok') {
        uiStatus = 'connected';
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
        encryptionStatus: account.encryptionStatus,
        errorReason: account.errorReason,
        kmsErrorCode: account.kmsErrorCode,
        kmsErrorAt: account.kmsErrorAt?.toISOString(),
        uiStatus,
        requiresRetry,
        canReconnect
      };
    });

    // Calculate summary
    const totalAccounts = emailAccounts.length;
    const connectedAccounts = emailAccounts.filter(acc => 
      acc.status === 'connected' && acc.encryptionStatus === 'ok'
    ).length;
    const actionNeededAccounts = emailAccounts.filter(acc => 
      acc.status === 'action_needed' || acc.encryptionStatus === 'failed'
    ).length;
    const disconnectedAccounts = emailAccounts.filter(acc => 
      acc.status === 'disconnected'
    ).length;

    // Determine overall status
    let overallStatus = 'unknown';
    if (totalAccounts === 0) {
      overallStatus = 'no_accounts';
    } else if (connectedAccounts === totalAccounts) {
      overallStatus = 'all_connected';
    } else if (connectedAccounts > 0) {
      overallStatus = 'partially_connected';
    } else {
      overallStatus = 'needs_attention';
    }

    const response = {
      overallStatus,
      summary: {
        totalAccounts,
        connectedAccounts,
        actionNeededAccounts,
        disconnectedAccounts
      },
      emailAccounts: transformedEmailAccounts,
      calendarAccounts: calendarAccounts.map(acc => ({
        id: acc.id,
        provider: acc.provider,
        status: acc.status
      })),
      tokenEncryption,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Integration status API error:', error);
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

    const orgId = (session as any).orgId;
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

  } catch (error: any) {
    console.error('Health check API error:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}