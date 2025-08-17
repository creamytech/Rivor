import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { getEmailBackfillQueue, getEmailSyncQueue } from '@/server/queue';

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

    // Get queue instances (but don't fetch jobs yet)
    const emailBackfillQueue = getEmailBackfillQueue();
    const emailSyncQueue = getEmailSyncQueue();

    // Simple queue info without fetching jobs
    return NextResponse.json({
      success: true,
      orgId,
      queues: {
        emailBackfill: {
          name: 'email-backfill',
          status: 'available'
        },
        emailSync: {
          name: 'email-sync', 
          status: 'available'
        }
      },
      message: 'Queue instances created successfully. Use /api/debug/sync-status for detailed sync info.'
    });

  } catch (error) {
    console.error('Queue status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get queue status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
