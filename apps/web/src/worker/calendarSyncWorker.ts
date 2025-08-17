import { Worker, Job } from 'bullmq';
import { prisma } from '@/server/db';
import { GoogleCalendarService } from '@/server/calendar';
import { logger } from '@/lib/logger';

interface CalendarSyncJobData {
  orgId: string;
  calendarAccountId: string;
  daysPastToSync?: number;
  daysFutureToSync?: number;
}

function getConnection() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  return { connection: { url } } as const;
}

async function processJob(job: Job) {
  const { orgId, calendarAccountId, daysPastToSync = 30, daysFutureToSync = 30 } = job.data as CalendarSyncJobData;
  const correlationId = `calendar-sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('[worker] calendar:sync started', { 
    correlationId,
    orgId, 
    calendarAccountId, 
    daysPastToSync,
    daysFutureToSync
  });

  try {
    // Update sync status to running
    await prisma.calendarAccount.update({
      where: { id: calendarAccountId },
      data: { 
        syncStatus: 'running',
        lastSyncedAt: new Date(),
        errorReason: null,
        status: 'connected'
      }
    });

    const calendarAccount = await prisma.calendarAccount.findUnique({
      where: { id: calendarAccountId },
      include: { org: true }
    });

    if (!calendarAccount) {
      throw new Error(`Calendar account ${calendarAccountId} not found`);
    }

    if (calendarAccount.provider !== 'google') {
      throw new Error(`Calendar sync only supports Google provider, got: ${calendarAccount.provider}`);
    }

    // Create Calendar service
    const calendarService = await GoogleCalendarService.createFromAccount(orgId, calendarAccountId);
    
    // Perform calendar sync
    const syncResult = await calendarService.syncEvents(orgId, calendarAccountId, daysPastToSync, daysFutureToSync);
    
    // Set up Calendar push notifications after successful sync
    try {
      await calendarService.setupPushNotifications(orgId, calendarAccountId);
      logger.info('[worker] Calendar push notifications setup successful', { 
        correlationId,
        calendarAccountId 
      });
    } catch (watchError: unknown) {
      // Don't fail the whole job if push notification setup fails
      logger.warn('[worker] Calendar push notifications setup failed, sync completed', {
        correlationId,
        calendarAccountId,
        error: watchError instanceof Error ? watchError.message : String(watchError)
      });
    }

    // Update sync status to idle
    await prisma.calendarAccount.update({
      where: { id: calendarAccountId },
      data: { 
        syncStatus: 'idle',
        lastSyncedAt: new Date(),
        status: 'connected'
      }
    });

    logger.info('[worker] calendar:sync completed successfully', { 
      correlationId,
      orgId, 
      calendarAccountId,
      syncResult
    });

  } catch (error: unknown) {
    logger.error('[worker] calendar:sync failed', { 
      correlationId,
      orgId, 
      calendarAccountId, 
      error: error instanceof Error ? error.message : String(error)
    });

    // Update sync status to error
    await prisma.calendarAccount.update({
      where: { id: calendarAccountId },
      data: { 
        syncStatus: 'error',
        errorReason: error instanceof Error ? error.message : String(error)
      }
    }).catch(() => {}); // Don't fail on database update error

    throw error;
  }
}

export function startCalendarSyncWorker() {
  const worker = new Worker('calendar:sync', processJob, getConnection());
  
  worker.on('failed', (job, err) => {
    console.error('[worker] calendar:sync failed', job?.id, err);
  });
  
  worker.on('completed', (job) => {
    console.log('[worker] calendar:sync completed', job.id);
  });
  
  return worker;
}
