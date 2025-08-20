import { Worker, Job } from 'bullmq';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';

interface CalendarBackfillJobData {
  orgId: string;
  calendarAccountId: string;
  daysFutureToSync?: number;
}

function getConnection() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  return { connection: { url } } as const;
}

async function processJob(job: Job) {
  const { orgId, calendarAccountId, daysFutureToSync = 90 } = job.data as CalendarBackfillJobData;
  const correlationId = `cal-backfill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
      logger.info('[worker] calendar-backfill started', { 
    correlationId,
    orgId, 
    calendarAccountId, 
    daysFutureToSync 
  });

  try {
    const calendarAccount = await prisma.calendarAccount.findUnique({
      where: { id: calendarAccountId },
      include: { org: true }
    });

    if (!calendarAccount) {
      throw new Error(`Calendar account ${calendarAccountId} not found`);
    }

    // Update status to running
    await prisma.calendarAccount.update({
      where: { id: calendarAccountId },
      data: { 
        status: 'syncing'
      }
    });

    // Calculate date range for backfill (past 30 days, future 90 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysFutureToSync);

    if (calendarAccount.provider === 'google') {
      // TODO: Implement Google Calendar backfill
      logger.info('[worker] calendar-backfill Google Calendar - not implemented yet', { 
        correlationId,
        provider: calendarAccount.provider,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    } else if (calendarAccount.provider === 'azure-ad') {
      // TODO: Implement Microsoft Calendar backfill
      logger.info('[worker] calendar-backfill Microsoft Calendar - not implemented yet', { 
        correlationId,
        provider: calendarAccount.provider,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    } else {
      throw new Error(`Unsupported calendar provider: ${calendarAccount.provider}`);
    }

    // Update status to connected
    await prisma.calendarAccount.update({
      where: { id: calendarAccountId },
      data: { 
        status: 'connected'
      }
    });

    logger.info('[worker] calendar-backfill completed successfully', { 
      correlationId,
      orgId, 
      calendarAccountId 
    });

  } catch (error: unknown) {
    logger.error('[worker] calendar-backfill failed', { 
      correlationId,
      orgId, 
      calendarAccountId, 
      error: error.message 
    });

    // Update status to error
    await prisma.calendarAccount.update({
      where: { id: calendarAccountId },
      data: { 
        status: 'error'
      }
    }).catch(() => {}); // Don't fail on database update error

    throw error;
  }
}

export function startCalendarBackfillWorker() {
  const worker = new Worker('calendar-backfill', processJob, getConnection());
  
  worker.on('failed', (job, err) => {
    console.error('[worker] calendar-backfill failed', job?.id, err);
  });
  
  worker.on('completed', (job) => {
    console.log('[worker] calendar-backfill completed', job.id);
  });
  
  return worker;
}
