import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { getEmailBackfillQueue, getEmailSyncQueue, getCalendarSyncQueue } from '@/server/queue';

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

    // Get queue instances
    const emailBackfillQueue = getEmailBackfillQueue();
    const emailSyncQueue = getEmailSyncQueue();
    const calendarSyncQueue = getCalendarSyncQueue();

    // Check job status for each queue
    const emailBackfillJobs = await emailBackfillQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
    const emailSyncJobs = await emailSyncQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
    const calendarSyncJobs = await calendarSyncQueue.getJobs(['waiting', 'active', 'completed', 'failed']);

    // Filter jobs for this org
    const orgEmailBackfillJobs = emailBackfillJobs.filter(job => 
      job.data.orgId === orgId
    );
    const orgEmailSyncJobs = emailSyncJobs.filter(job => 
      job.data.orgId === orgId
    );
    const orgCalendarSyncJobs = calendarSyncJobs.filter(job => 
      job.data.orgId === orgId
    );

    // Get recent jobs (last 10) with more details
    const recentEmailBackfill = orgEmailBackfillJobs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map(job => ({
        id: job.id,
        status: job.finishedOn ? 'completed' : job.failedReason ? 'failed' : job.processedOn ? 'active' : 'waiting',
        timestamp: new Date(job.timestamp).toISOString(),
        data: job.data,
        failedReason: job.failedReason,
        processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
        finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts
      }));

    const recentEmailSync = orgEmailSyncJobs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map(job => ({
        id: job.id,
        status: job.finishedOn ? 'completed' : job.failedReason ? 'failed' : job.processedOn ? 'active' : 'waiting',
        timestamp: new Date(job.timestamp).toISOString(),
        data: job.data,
        failedReason: job.failedReason,
        processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
        finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts
      }));

    const recentCalendarSync = orgCalendarSyncJobs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map(job => ({
        id: job.id,
        status: job.finishedOn ? 'completed' : job.failedReason ? 'failed' : job.processedOn ? 'active' : 'waiting',
        timestamp: new Date(job.timestamp).toISOString(),
        data: job.data,
        failedReason: job.failedReason,
        processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
        finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts
      }));

    // Get failed jobs specifically
    const failedEmailBackfill = recentEmailBackfill.filter(job => job.status === 'failed');
    const failedEmailSync = recentEmailSync.filter(job => job.status === 'failed');
    const failedCalendarSync = recentCalendarSync.filter(job => job.status === 'failed');

    return NextResponse.json({
      success: true,
      orgId,
      queues: {
        emailBackfill: {
          totalJobs: orgEmailBackfillJobs.length,
          waiting: orgEmailBackfillJobs.filter(j => !j.processedOn && !j.failedReason).length,
          active: orgEmailBackfillJobs.filter(j => j.processedOn && !j.finishedOn).length,
          completed: orgEmailBackfillJobs.filter(j => j.finishedOn).length,
          failed: orgEmailBackfillJobs.filter(j => j.failedReason).length,
          recent: recentEmailBackfill,
          failedJobs: failedEmailBackfill
        },
        emailSync: {
          totalJobs: orgEmailSyncJobs.length,
          waiting: orgEmailSyncJobs.filter(j => !j.processedOn && !j.failedReason).length,
          active: orgEmailSyncJobs.filter(j => j.processedOn && !j.finishedOn).length,
          completed: orgEmailSyncJobs.filter(j => j.finishedOn).length,
          failed: orgEmailSyncJobs.filter(j => j.failedReason).length,
          recent: recentEmailSync,
          failedJobs: failedEmailSync
        },
        calendarSync: {
          totalJobs: orgCalendarSyncJobs.length,
          waiting: orgCalendarSyncJobs.filter(j => !j.processedOn && !j.failedReason).length,
          active: orgCalendarSyncJobs.filter(j => j.processedOn && !j.finishedOn).length,
          completed: orgCalendarSyncJobs.filter(j => j.finishedOn).length,
          failed: orgCalendarSyncJobs.filter(j => j.failedReason).length,
          recent: recentCalendarSync,
          failedJobs: failedCalendarSync
        }
      },
      message: 'Sync job status retrieved'
    });

  } catch (error) {
    console.error('Check sync jobs error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check sync jobs',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
