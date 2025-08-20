import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { enqueueEmailBackfill, enqueueCalendarSync } from '@/server/queue';

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

    // Check email accounts
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId, status: 'connected' },
      select: { id: true, email: true, provider: true }
    });

    // Check calendar accounts
    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: { orgId, status: 'connected' },
      select: { id: true, provider: true }
    });

    // Test queue functions (without actually queuing)
    let emailQueueTest = { available: false, error: null };
    let calendarQueueTest = { available: false, error: null };

    try {
      // Test email queue function
      if (emailAccounts.length > 0) {
        await enqueueEmailBackfill(orgId, emailAccounts[0].id, 1); // Just 1 day to test
        emailQueueTest = { available: true, error: null };
      }
    } catch (error) {
      emailQueueTest = { 
        available: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }

    try {
      // Test calendar queue function
      if (calendarAccounts.length > 0) {
        await enqueueCalendarSync(orgId, calendarAccounts[0].id, 1, 1); // Just 1 day to test
        calendarQueueTest = { available: true, error: null };
      }
    } catch (error) {
      calendarQueueTest = { 
        available: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }

    return NextResponse.json({
      success: true,
      orgId,
      emailAccounts: {
        count: emailAccounts.length,
        accounts: emailAccounts,
        queueTest: emailQueueTest
      },
      calendarAccounts: {
        count: calendarAccounts.length,
        accounts: calendarAccounts,
        queueTest: calendarQueueTest
      },
      syncEndpoints: {
        email: '/api/debug/sync-email',
        calendar: '/api/debug/sync-calendar'
      },
      message: 'Sync button test completed'
    });

  } catch (error) {
    console.error('Sync button test error:', error);
    return NextResponse.json(
      {
        error: 'Failed to test sync buttons',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
