import { Worker, Job } from 'bullmq';
import { prisma } from '@/server/db';
import { GmailService } from '@/server/gmail';
import { CalendarWebhookService } from '@/server/calendar-webhooks';
import { logger } from '@/lib/logger';

function getConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not set');
  return { connection: { url } } as const;
}

interface RenewJobData {
  provider: 'gmail' | 'calendar';
  accountId: string;
  orgId: string;
}

async function processJob(job: Job) {
  const { provider, accountId, orgId } = job.data as RenewJobData;
  const correlationId = `renew-${provider}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('Starting webhook renewal', {
    provider,
    accountId,
    orgId,
    correlationId,
    action: 'webhook_renew_start'
  });

  try {
    if (provider === 'gmail') {
      await renewGmailWatch(orgId, accountId, correlationId);
    } else if (provider === 'calendar') {
      await renewCalendarChannel(orgId, accountId, correlationId);
    }

    logger.info('Webhook renewal completed successfully', {
      provider,
      accountId,
      orgId,
      correlationId,
      action: 'webhook_renew_success'
    });
  } catch (error: unknown) {
    logger.error('Webhook renewal failed', {
      provider,
      accountId,
      orgId,
      correlationId,
      error: error.message,
      action: 'webhook_renew_failed'
    });
    throw error;
  }
}

async function renewGmailWatch(orgId: string, emailAccountId: string, correlationId: string): Promise<void> {
  try {
    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId }
    });

    if (!emailAccount) {
      throw new Error(`Email account ${emailAccountId} not found`);
    }

    // Check if watch is expiring soon (within 24 hours)
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours from now
    
    if (emailAccount.watchExpiration && emailAccount.watchExpiration > expiryThreshold) {
      logger.info('Gmail watch not expiring soon, skipping renewal', {
        orgId,
        emailAccountId,
        correlationId,
        watchExpiration: emailAccount.watchExpiration,
        action: 'gmail_watch_skip_renewal'
      });
      return;
    }

    // Create Gmail service and renew watch
    const gmailService = await GmailService.createFromAccount(orgId, emailAccountId);
    await gmailService.watchMailbox(orgId, emailAccountId);

    logger.info('Gmail watch renewed successfully', {
      orgId,
      emailAccountId,
      correlationId,
      action: 'gmail_watch_renewed'
    });
  } catch (error: unknown) {
    // Update account status on renewal failure
    await prisma.emailAccount.update({
      where: { id: emailAccountId },
      data: { status: 'action_needed' }
    });

    throw new Error(`Gmail watch renewal failed: ${error.message}`);
  }
}

async function renewCalendarChannel(orgId: string, calendarAccountId: string, correlationId: string): Promise<void> {
  try {
    const calendarAccount = await prisma.calendarAccount.findUnique({
      where: { id: calendarAccountId }
    });

    if (!calendarAccount) {
      throw new Error(`Calendar account ${calendarAccountId} not found`);
    }

    // Check if channel is expiring soon (within 24 hours)
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours from now
    
    if (calendarAccount.channelExpiration && calendarAccount.channelExpiration > expiryThreshold) {
      logger.info('Calendar channel not expiring soon, skipping renewal', {
        orgId,
        calendarAccountId,
        correlationId,
        channelExpiration: calendarAccount.channelExpiration,
        action: 'calendar_channel_skip_renewal'
      });
      return;
    }

    // Create calendar webhook service and renew channel
    const calendarWebhookService = await CalendarWebhookService.createFromOrg(orgId);
    await calendarWebhookService.renewWatch(calendarAccountId);

    logger.info('Calendar channel renewed successfully', {
      orgId,
      calendarAccountId,
      correlationId,
      action: 'calendar_channel_renewed'
    });
  } catch (error: unknown) {
    // Update account status on renewal failure
    await prisma.calendarAccount.update({
      where: { id: calendarAccountId },
      data: { status: 'channel_renewal_failed' }
    });

    throw new Error(`Calendar channel renewal failed: ${error.message}`);
  }
}

export function startWebhookRenewWorker() {
  const worker = new Worker('webhooks-renew', processJob, getConnection());
  
  worker.on('failed', (job, err) => {
    logger.error('Webhook renewal worker job failed', {
      jobId: job?.id,
      jobData: job?.data,
      error: err.message,
      action: 'worker_job_failed'
    });
  });
  
  worker.on('completed', (job) => {
    logger.info('Webhook renewal worker job completed', {
      jobId: job.id,
      jobData: job.data,
      action: 'worker_job_completed'
    });
  });

  logger.info('Webhook renewal worker started', {
    action: 'worker_started'
  });

  return worker;
}