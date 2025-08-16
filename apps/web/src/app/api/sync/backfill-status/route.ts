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

    // Get email accounts with sync status
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        syncStatus: true,
        lastSyncedAt: true,
        errorReason: true
      }
    });

    // Get calendar accounts with sync status
    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        syncStatus: true,
        lastSyncedAt: true,
        errorReason: true
      }
    });

    // Calculate email account status
    const emailAccountStatus = {
      total: emailAccounts.length,
      running: emailAccounts.filter(acc => acc.syncStatus === 'running').length,
      completed: emailAccounts.filter(acc => acc.syncStatus === 'idle' && acc.lastSyncedAt).length,
      failed: emailAccounts.filter(acc => acc.syncStatus === 'error').length
    };

    // Calculate calendar account status
    const calendarAccountStatus = {
      total: calendarAccounts.length,
      running: calendarAccounts.filter(acc => acc.syncStatus === 'running').length,
      completed: calendarAccounts.filter(acc => acc.syncStatus === 'idle' && acc.lastSyncedAt).length,
      failed: calendarAccounts.filter(acc => acc.syncStatus === 'error').length
    };

    // Get total counts
    const [threadsTotal, eventsTotal] = await Promise.all([
      prisma.emailThread.count({ where: { orgId } }),
      prisma.calendarEvent.count({ where: { orgId } })
    ]);

    // Calculate estimated time remaining (rough estimate)
    let estimatedTimeRemaining: number | undefined;
    const totalRunning = emailAccountStatus.running + calendarAccountStatus.running;
    if (totalRunning > 0) {
      // Rough estimate: 2 minutes per account
      estimatedTimeRemaining = totalRunning * 2 * 60; // seconds
    }

    const status = {
      emailAccounts: emailAccountStatus,
      calendarAccounts: calendarAccountStatus,
      threadsTotal,
      eventsTotal,
      estimatedTimeRemaining
    };

    logger.info('Backfill status fetched', { 
      orgId, 
      status 
    });

    return NextResponse.json(status);

  } catch (error) {
    logger.error('Failed to fetch backfill status', { error });
    return NextResponse.json(
      { error: 'Failed to fetch backfill status' },
      { status: 500 }
    );
  }
}
