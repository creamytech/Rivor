import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { getEmailSyncQueue } from '@/server/queue';

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

    // Test basic queue connection
    const queue = getEmailSyncQueue();
    
    // Try to get queue info without fetching jobs
    const queueName = queue.name;
    const isConnected = !!queue.client;

    return NextResponse.json({
      success: true,
      orgId,
      queueName,
      isConnected,
      message: 'Queue connection test completed'
    });

  } catch (error) {
    console.error('Queue test error:', error);
    return NextResponse.json(
      {
        error: 'Failed to test queue',
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

    // Test adding a simple job
    const queue = getEmailSyncQueue();
    
    // Add a test job
    const job = await queue.add('test', { 
      orgId, 
      test: true, 
      timestamp: new Date().toISOString() 
    }, {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: true
    });

    return NextResponse.json({
      success: true,
      message: 'Test job added successfully',
      jobId: job.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Queue test job error:', error);
    return NextResponse.json(
      {
        error: 'Failed to add test job',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
