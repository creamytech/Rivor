import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

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

    // Get email accounts with detailed sync status
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        provider: true,
        email: true,
        status: true,
        syncStatus: true,
        lastSyncedAt: true,
        errorReason: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Get calendar accounts
    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        provider: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Get counts
    const [threadsTotal, eventsTotal] = await Promise.all([
      prisma.emailThread.count({ where: { orgId } }),
      prisma.calendarEvent.count({ where: { orgId } })
    ]);

    return NextResponse.json({
      success: true,
      orgId,
      emailAccounts,
      calendarAccounts,
      counts: {
        threadsTotal,
        eventsTotal
      }
    });

  } catch (error) {
    console.error('Debug sync status error:', error);
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
