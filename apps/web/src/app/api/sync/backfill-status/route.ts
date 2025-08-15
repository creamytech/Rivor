import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

/**
 * Backfill status endpoint for progress tracking
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

    // Get email account sync status
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        syncStatus: true,
        status: true,
        encryptionStatus: true
      }
    });

    // Get calendar account sync status
    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        status: true
      }
    });

    // Count threads and events
    const threadsTotal = await prisma.emailThread.count({
      where: { orgId }
    });

    const eventsTotal = await prisma.calendarEvent.count({
      where: { orgId }
    });

    // Calculate email account states
    const emailAccountStates = {
      total: emailAccounts.length,
      running: emailAccounts.filter(acc => acc.syncStatus === 'running').length,
      completed: emailAccounts.filter(acc => 
        acc.syncStatus === 'idle' && 
        acc.status === 'connected' && 
        acc.encryptionStatus === 'ok'
      ).length,
      failed: emailAccounts.filter(acc => 
        acc.syncStatus === 'error' || 
        acc.status === 'action_needed' ||
        acc.encryptionStatus === 'failed'
      ).length
    };

    // Calculate calendar account states
    const calendarAccountStates = {
      total: calendarAccounts.length,
      running: calendarAccounts.filter(acc => acc.status === 'syncing').length,
      completed: calendarAccounts.filter(acc => acc.status === 'connected').length,
      failed: calendarAccounts.filter(acc => acc.status === 'error').length
    };

    // Estimate time remaining (rough calculation)
    let estimatedTimeRemaining: number | undefined;
    const activeBackfills = emailAccountStates.running + calendarAccountStates.running;
    if (activeBackfills > 0) {
      // Estimate 2-5 minutes per account based on data volume
      estimatedTimeRemaining = activeBackfills * 180; // 3 minutes average in seconds
    }

    const response = {
      emailAccounts: emailAccountStates,
      calendarAccounts: calendarAccountStates,
      threadsTotal,
      eventsTotal,
      estimatedTimeRemaining
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Backfill status API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backfill status' },
      { status: 500 }
    );
  }
}
