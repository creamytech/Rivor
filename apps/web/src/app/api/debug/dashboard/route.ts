import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { startAllWorkers } from '@/worker/startWorkers';
import { getEmailSyncQueue, getEmailBackfillQueue } from '@/server/queue';
import Redis from 'ioredis';
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

    const userEmail = session.user.email;
    const startTime = Date.now();

    // 1. Basic Auth & Session Check
    const authStatus = {
      authenticated: true,
      userEmail,
      orgId,
      sessionValid: true
    };

    // 2. Database Connection Test
    let dbStatus = { connected: false, error: null };
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = { connected: true, error: null };
    } catch (error) {
      dbStatus = { connected: false, error: error instanceof Error ? error.message : String(error) };
    }

    // 3. Redis Connection Test
    let redisStatus = { connected: false, url: null, error: null, operations: null };
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const redis = new Redis(redisUrl, {
        connectTimeout: 5000,
        lazyConnect: true,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      });

      const testKey = `debug:${orgId}:${Date.now()}`;
      const testValue = 'test-value';

      await redis.set(testKey, testValue, 'EX', 60);
      const retrievedValue = await redis.get(testKey);
      await redis.del(testKey);
      await redis.quit();

      redisStatus = {
        connected: true,
        url: redisUrl.replace(/\/\/.*@/, '//***:***@'),
        error: null,
        operations: {
          set: true,
          get: retrievedValue === testValue,
          del: true
        }
      };
    } catch (error) {
      redisStatus = {
        connected: false,
        url: (process.env.REDIS_URL || 'redis://localhost:6379').replace(/\/\/.*@/, '//***:***@'),
        error: error instanceof Error ? error.message : String(error),
        operations: null
      };
    }

    // 4. Queue System Test
    let queueStatus = { connected: false, jobs: null, error: null };
    try {
      const emailSyncQueue = getEmailSyncQueue();
      const emailBackfillQueue = getEmailBackfillQueue();
      
      // Test adding a job
      const testJob = await emailSyncQueue.add('debug-test', { 
        orgId, 
        test: true, 
        timestamp: new Date().toISOString() 
      }, {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: true
      });

      // Get queue info
      const waitingJobs = await emailSyncQueue.getWaiting();
      const activeJobs = await emailSyncQueue.getActive();
      const completedJobs = await emailSyncQueue.getJobs(['completed']);
      const failedJobs = await emailSyncQueue.getJobs(['failed']);

      queueStatus = {
        connected: true,
        jobs: {
          testJobId: testJob.id,
          waiting: waitingJobs.length,
          active: activeJobs.length,
          completed: completedJobs.length,
          failed: failedJobs.length
        },
        error: null
      };
    } catch (error) {
      queueStatus = {
        connected: false,
        jobs: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // 5. Worker Status
    let workerStatus = { started: false, workers: null, error: null };
    try {
      const workers = startAllWorkers();
      workerStatus = {
        started: workers !== null,
        workers: workers ? {
          emailBackfill: !!workers.emailBackfillWorker,
          emailSync: !!workers.emailSyncWorker,
          calendarSync: !!workers.calendarSyncWorker
        } : null,
        error: null
      };
    } catch (error) {
      workerStatus = {
        started: false,
        workers: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // 6. Email Account Status
    let emailStatus = { accounts: [], counts: null, error: null };
    try {
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
          createdAt: true
        }
      });

      const threadCount = await prisma.emailThread.count({ where: { orgId } });
      const messageCount = await prisma.emailMessage.count({ where: { orgId } });

      emailStatus = {
        accounts: emailAccounts,
        counts: { threads: threadCount, messages: messageCount },
        error: null
      };
    } catch (error) {
      emailStatus = {
        accounts: [],
        counts: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // 7. Calendar Account Status
    let calendarStatus = { accounts: [], counts: null, error: null };
    try {
      const calendarAccounts = await prisma.calendarAccount.findMany({
        where: { orgId },
        select: {
          id: true,
          provider: true,
          status: true,
          createdAt: true
        }
      });

      const eventCount = await prisma.calendarEvent.count({ where: { orgId } });

      calendarStatus = {
        accounts: calendarAccounts,
        counts: { events: eventCount },
        error: null
      };
    } catch (error) {
      calendarStatus = {
        accounts: [],
        counts: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // 8. Environment Variables Check
    const envStatus = {
      REDIS_URL: process.env.REDIS_URL ? 'Set' : 'Not Set',
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not Set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not Set',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not Set'
    };

    // 9. System Health Summary
    const healthSummary = {
      overall: dbStatus.connected && redisStatus.connected && queueStatus.connected && workerStatus.started,
      database: dbStatus.connected,
      redis: redisStatus.connected,
      queue: queueStatus.connected,
      workers: workerStatus.started,
      emailAccounts: emailStatus.accounts.length > 0,
      calendarAccounts: calendarStatus.accounts.length > 0
    };

    const endTime = Date.now();
    const duration = endTime - startTime;

    logger.info('Debug dashboard accessed', {
      orgId,
      userEmail,
      duration,
      healthSummary
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      orgId,
      userEmail,
      healthSummary,
      auth: authStatus,
      database: dbStatus,
      redis: redisStatus,
      queue: queueStatus,
      workers: workerStatus,
      email: emailStatus,
      calendar: calendarStatus,
      environment: envStatus
    });

  } catch (error) {
    console.error('Debug dashboard error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate debug dashboard',
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

    const body = await req.json();
    const action = body.action;

    switch (action) {
      case 'force-sync':
        // Force update sync status to idle
        const emailAccounts = await prisma.emailAccount.findMany({
          where: { orgId, status: 'connected' }
        });

        const updatedAccounts = [];
        for (const account of emailAccounts) {
          const updatedAccount = await prisma.emailAccount.update({
            where: { id: account.id },
            data: {
              syncStatus: 'idle',
              lastSyncedAt: new Date(),
              errorReason: null
            }
          });
          updatedAccounts.push(updatedAccount);
        }

        return NextResponse.json({
          success: true,
          action: 'force-sync',
          message: `Updated sync status for ${updatedAccounts.length} account(s)`,
          accounts: updatedAccounts.map(acc => ({
            id: acc.id,
            email: acc.email,
            syncStatus: acc.syncStatus,
            lastSyncedAt: acc.lastSyncedAt
          }))
        });

      case 'start-workers':
        // Force start workers
        const workers = startAllWorkers();
        return NextResponse.json({
          success: true,
          action: 'start-workers',
          message: workers ? 'Workers started successfully' : 'Failed to start workers',
          workersStarted: workers !== null
        });

      case 'test-queue':
        // Test queue job
        const queue = getEmailSyncQueue();
        const job = await queue.add('debug-test', { 
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
          action: 'test-queue',
          message: 'Test job added successfully',
          jobId: job.id
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['force-sync', 'start-workers', 'test-queue']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Debug dashboard action error:', error);
    return NextResponse.json(
      {
        error: 'Failed to execute debug action',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
