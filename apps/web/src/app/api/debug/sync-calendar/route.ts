import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { enqueueCalendarSync } from '@/server/queue';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get calendar accounts
    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: { orgId, status: 'connected' }
    });

    if (calendarAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No connected calendar accounts found'
      }, { status: 400 });
    }

    // Queue sync for each account
    const syncJobs = [];
    for (const account of calendarAccounts) {
      try {
        await enqueueCalendarSync(orgId, account.id, 30, 30); // Sync last 30 days and next 30 days
        syncJobs.push({
          accountId: account.id,
          provider: account.provider,
          status: 'queued'
        });
      } catch (error) {
        syncJobs.push({
          accountId: account.id,
          provider: account.provider,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Manual calendar sync triggered', {
      orgId,
      accountsCount: calendarAccounts.length,
      syncJobs
    });

    return NextResponse.json({
      success: true,
      message: `Calendar sync queued for ${calendarAccounts.length} account(s)`,
      accounts: syncJobs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to trigger calendar sync:', error);
    return NextResponse.json(
      { error: 'Failed to trigger calendar sync', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
