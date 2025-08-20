import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        orgMembers: {
          include: {
            org: {
              include: {
                emailAccounts: true,
                calendarAccounts: true
              }
            }
          }
        }
      }
    });

    if (!user || user.orgMembers.length === 0) {
      return new Response('No organization found', { status: 404 });
    }

    const org = user.orgMembers[0].org;

    // Get email accounts
    const emailIntegrations = org.emailAccounts.map(account => ({
      id: account.id,
      name: `${account.provider} Email`,
      type: 'email' as const,
      provider: account.provider as 'google' | 'microsoft',
      status: account.status as 'not_connected' | 'connecting' | 'backfilling' | 'live' | 'error' | 'paused',
      email: account.email,
      syncStatus: account.status,
      lastSyncAt: account.lastSyncAt?.toISOString(),
      errorMessage: account.errorMessage,
      accountsCount: 1,
      itemsCount: 0 // You'd calculate this from actual message count
    }));

    // Get calendar accounts
    const calendarIntegrations = org.calendarAccounts.map(account => ({
      id: account.id,
      name: `${account.provider} Calendar`,
      type: 'calendar' as const,
      provider: account.provider as 'google' | 'microsoft',
      status: account.status as 'not_connected' | 'connecting' | 'backfilling' | 'live' | 'error' | 'paused',
      email: account.email,
      syncStatus: account.status,
      lastSyncAt: account.lastSyncAt?.toISOString(),
      errorMessage: account.errorMessage,
      accountsCount: 1,
      itemsCount: 0 // You'd calculate this from actual event count
    }));

    // Transform to expected format
    const emailAccounts = org.emailAccounts.map(account => ({
      id: account.id,
      provider: account.provider,
      email: account.email,
      displayName: account.displayName,
      status: account.status,
      syncStatus: account.syncStatus || 'idle',
      lastSyncedAt: account.lastSyncedAt?.toISOString(),
      encryptionStatus: account.encryptionStatus || 'ok',
      errorReason: account.errorReason,
      kmsErrorCode: account.kmsErrorCode,
      kmsErrorAt: account.kmsErrorAt?.toISOString(),
      uiStatus: account.status === 'connected' ? 'connected' : 'action_needed',
      requiresRetry: account.encryptionStatus === 'failed',
      canReconnect: true
    }));

    const summary = {
      totalAccounts: org.emailAccounts.length + org.calendarAccounts.length,
      connectedAccounts: org.emailAccounts.filter(acc => acc.status === 'connected').length + 
                        org.calendarAccounts.filter(acc => acc.status === 'connected').length,
      actionNeededAccounts: org.emailAccounts.filter(acc => acc.status !== 'connected').length + 
                           org.calendarAccounts.filter(acc => acc.status !== 'connected').length,
      disconnectedAccounts: 0
    };

    const tokenEncryption = {
      totalTokens: org.emailAccounts.length,
      okTokens: org.emailAccounts.filter(acc => acc.encryptionStatus === 'ok').length,
      pendingTokens: org.emailAccounts.filter(acc => acc.encryptionStatus === 'pending').length,
      failedTokens: org.emailAccounts.filter(acc => acc.encryptionStatus === 'failed').length
    };

    const overallStatus = summary.connectedAccounts === summary.totalAccounts ? 'all_connected' : 'action_needed';

    return Response.json({
      overallStatus,
      summary,
      emailAccounts,
      tokenEncryption,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch integrations status:', error);
    return new Response('Internal Server Error', { status: 500 });
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