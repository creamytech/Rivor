import { Worker, Job } from 'bullmq';
import { prisma } from '@/server/db';
import { probeAllGoogleServices } from '@/server/health-probes';
import { logger } from '@/lib/logger';

function getConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not set');
  return { connection: { url } } as const;
}

interface ProbeJobData {
  orgId: string;
  force?: boolean;
}

async function processJob(job: Job) {
  const { orgId, force = false } = job.data as ProbeJobData;
  const correlationId = `probe-${orgId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('Starting scheduled health probe', {
    orgId,
    correlationId,
    force,
    action: 'scheduled_probe_start'
  });

  try {
    // Check if org has Google accounts
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      include: {
        emailAccounts: { 
          where: { provider: 'google' } 
        },
        calendarAccounts: { 
          where: { provider: 'google' } 
        }
      }
    });

    if (!org) {
      logger.warn('Org not found for scheduled probe', {
        orgId,
        correlationId,
        action: 'scheduled_probe_org_not_found'
      });
      return;
    }

    // Skip if no Google accounts configured
    if (org.emailAccounts.length === 0 && org.calendarAccounts.length === 0) {
      logger.info('No Google accounts for scheduled probe', {
        orgId,
        correlationId,
        action: 'scheduled_probe_no_accounts'
      });
      return;
    }

    // Run health probes
    const startTime = Date.now();
    const results = await probeAllGoogleServices(orgId, force);
    const duration = Date.now() - startTime;

    logger.info('Scheduled health probe completed', {
      orgId,
      correlationId,
      duration,
      gmailSuccess: results.gmail.success,
      calendarSuccess: results.calendar.success,
      action: 'scheduled_probe_complete'
    });

    // Log any probe failures for monitoring
    if (!results.gmail.success) {
      logger.warn('Scheduled Gmail probe failed', {
        orgId,
        correlationId,
        error: results.gmail.error,
        action: 'scheduled_probe_gmail_failed'
      });
    }

    if (!results.calendar.success) {
      logger.warn('Scheduled Calendar probe failed', {
        orgId,
        correlationId,
        error: results.calendar.error,
        action: 'scheduled_probe_calendar_failed'
      });
    }

  } catch (error: any) {
    logger.error('Scheduled health probe failed', {
      orgId,
      correlationId,
      error: error.message,
      action: 'scheduled_probe_error'
    });
    throw error;
  }
}

export function startHealthProbeWorker() {
  const worker = new Worker('health:probe', processJob, getConnection());
  
  worker.on('failed', (job, err) => {
    logger.error('Health probe worker job failed', {
      jobId: job?.id,
      jobData: job?.data,
      error: err.message,
      action: 'probe_worker_job_failed'
    });
  });
  
  worker.on('completed', (job) => {
    logger.debug('Health probe worker job completed', {
      jobId: job.id,
      jobData: job.data,
      action: 'probe_worker_job_completed'
    });
  });

  logger.info('Health probe worker started', {
    action: 'probe_worker_started'
  });

  return worker;
}

// Add to queue management
export async function scheduleHealthProbes() {
  const correlationId = `schedule-probes-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('Scheduling health probes for all orgs', {
      correlationId,
      action: 'schedule_probes_start'
    });

    // Get all orgs that have Google accounts
    const orgs = await prisma.org.findMany({
      where: {
        OR: [
          { emailAccounts: { some: { provider: 'google' } } },
          { calendarAccounts: { some: { provider: 'google' } } }
        ]
      },
      select: { 
        id: true,
        name: true,
        updatedAt: true 
      }
    });

    const { Queue } = await import('bullmq');
    const probeQueue = new Queue('health:probe', getConnection());

    let scheduledCount = 0;

    for (const org of orgs) {
      // Determine probe frequency based on org activity
      const lastUpdate = org.updatedAt.getTime();
      const timeSinceUpdate = Date.now() - lastUpdate;
      const isActiveOrg = timeSinceUpdate < (7 * 24 * 60 * 60 * 1000); // Active within 7 days
      
      // Active orgs: probe every 5 minutes
      // Inactive orgs: probe every 30 minutes
      const intervalMs = isActiveOrg ? (5 * 60 * 1000) : (30 * 60 * 1000);
      
      await probeQueue.add(
        `probe-${org.id}`,
        { orgId: org.id },
        {
          repeat: { every: intervalMs },
          removeOnComplete: 5,
          removeOnFail: 3,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 30000, // 30 second delay
          }
        }
      );

      scheduledCount++;
    }

    logger.info('Health probes scheduled successfully', {
      correlationId,
      orgCount: orgs.length,
      scheduledCount,
      action: 'schedule_probes_complete'
    });

  } catch (error: any) {
    logger.error('Failed to schedule health probes', {
      correlationId,
      error: error.message,
      action: 'schedule_probes_failed'
    });
    throw error;
  }
}
