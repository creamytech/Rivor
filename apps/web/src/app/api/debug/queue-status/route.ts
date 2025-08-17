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

    // Get queue status
    const emailBackfillQueue = getEmailBackfillQueue();
    const emailSyncQueue = getEmailSyncQueue();

    const [backfillJobs, syncJobs, backfillWaiting, syncWaiting, backfillActive, syncActive] = await Promise.all([
      emailBackfillQueue.getJobs(['completed', 'failed']),
      emailSyncQueue.getJobs(['completed', 'failed']),
      emailBackfillQueue.getWaiting(),
      emailSyncQueue.getWaiting(),
      emailBackfillQueue.getActive(),
      emailSyncQueue.getActive()
    ]);

    // Get recent jobs for this org
    const orgBackfillJobs = backfillJobs.filter(job => job.data.orgId === orgId);
    const orgSyncJobs = syncJobs.filter(job => job.data.orgId === orgId);

    return NextResponse.json({
      success: true,
      orgId,
      queues: {
        emailBackfill: {
          waiting: backfillWaiting.length,
          active: backfillActive.length,
          completed: backfillJobs.length,
          failed: backfillJobs.filter(j => j.failedReason).length
        },
        emailSync: {
          waiting: syncWaiting.length,
          active: syncActive.length,
          completed: syncJobs.length,
          failed: syncJobs.filter(j => j.failedReason).length
        }
      },
      orgJobs: {
        backfill: orgBackfillJobs.map(job => ({
          id: job.id,
          status: job.finishedOn ? 'completed' : 'failed',
          data: job.data,
          timestamp: job.finishedOn || job.processedOn,
          error: job.failedReason
        })),
        sync: orgSyncJobs.map(job => ({
          id: job.id,
          status: job.finishedOn ? 'completed' : 'failed',
          data: job.data,
          timestamp: job.finishedOn || job.processedOn,
          error: job.failedReason
        }))
      }
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
