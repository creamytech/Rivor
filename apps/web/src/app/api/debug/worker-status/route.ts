import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { startAllWorkers } from '@/worker/startWorkers';
import { logger } from '@/lib/logger';

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

    // Try to start workers
    const workers = startAllWorkers();

    return NextResponse.json({
      success: true,
      orgId,
      workersStarted: workers !== null,
      workers: workers ? {
        emailBackfill: !!workers.emailBackfillWorker,
        emailSync: !!workers.emailSyncWorker,
        calendarSync: !!workers.calendarSyncWorker
      } : null,
      message: workers ? 'Workers started successfully' : 'Failed to start workers'
    });

  } catch (error) {
    console.error('Worker status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check worker status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

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

    // Force start workers
    const workers = startAllWorkers();

    logger.info('Workers manually started', {
      orgId,
      workersStarted: workers !== null,
      action: 'manual_worker_start'
    });

    return NextResponse.json({
      success: true,
      message: workers ? 'Workers started successfully' : 'Failed to start workers',
      workersStarted: workers !== null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Worker start error:', error);
    return NextResponse.json(
      {
        error: 'Failed to start workers',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
