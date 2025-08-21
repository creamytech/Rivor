import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Sync status endpoint for inbox widget
 */
export async function GET(_req: NextRequest) {
  try {
    // Development bypass - return mock data
    if (process.env.NODE_ENV === 'development') {
      const mockSyncStatus = {
        accountsTotal: 2,
        accountsConnected: 2,
        accountsBackfilling: 0,
        accountsError: 0,
        threadsTotal: 47,
        lastSyncAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        syncInProgress: false
      };

      return NextResponse.json(mockSyncStatus);
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get account stats
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        status: true,
        syncStatus: true,
        lastSyncedAt: true,
        encryptionStatus: true
      }
    });

    // Get thread count
    const threadsTotal = await prisma.emailThread.count({
      where: { orgId }
    });

    // Calculate account status
    const accountsTotal = emailAccounts.length;
    const accountsConnected = emailAccounts.filter(acc => 
      acc.status === 'connected' && acc.encryptionStatus === 'ok'
    ).length;
    const accountsBackfilling = emailAccounts.filter(acc => 
      acc.syncStatus === 'running' || acc.syncStatus === 'scheduled'
    ).length;
    const accountsError = emailAccounts.filter(acc => 
      acc.status === 'action_needed' || 
      acc.syncStatus === 'error' || 
      acc.encryptionStatus === 'failed'
    ).length;

    // Find most recent sync time
    const lastSyncAt = emailAccounts
      .filter(acc => acc.lastSyncedAt)
      .map(acc => acc.lastSyncedAt!)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    const syncInProgress = accountsBackfilling > 0;

    const response = {
      accountsTotal,
      accountsConnected,
      accountsBackfilling,
      accountsError,
      threadsTotal,
      lastSyncAt: lastSyncAt?.toISOString(),
      syncInProgress
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Sync status API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}
