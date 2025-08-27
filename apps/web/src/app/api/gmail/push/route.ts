import { NextRequest } from 'next/server';
import { enqueueEmailSync } from '@/server/queue';
import { prisma } from '@/lib/db-pool';
import { GmailService } from '@/server/gmail';
import { logger } from '@/lib/logger';

// Force dynamic rendering - this route uses request headers
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const correlationId = `gmail-push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  try {
    logger.info('Gmail push notification received', {
      correlationId,
      action: 'gmail_push_received'
    });

    // Verify notification authenticity
    const token = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN;
    const provided = req.headers.get('x-goog-verification-token') || req.headers.get('x-verification-token');
    
    if (!token) {
      logger.warn('Gmail push verification token not configured', {
        correlationId,
        action: 'gmail_push_no_token'
      });
      return new Response('Server misconfigured', { status: 500 });
    }
    
    if (provided !== token) {
      logger.warn('Gmail push notification verification failed', {
        correlationId,
        providedToken: provided?.slice(0, 10) + '...' || 'none',
        action: 'gmail_push_verification_failed'
      });
      return new Response('Forbidden', { status: 403 });
    }
    
    const body = await req.json().catch(() => null) as unknown;
    const message = body?.message;
    const attributes = message?.attributes ?? {};
    const dataB64: string | undefined = message?.data;
    
    // Decode the pub/sub data if available
    let notificationData: unknown = {};
    if (dataB64) {
      try {
        const decoded = Buffer.from(dataB64, 'base64').toString();
        notificationData = JSON.parse(decoded);
      } catch (parseError) {
        logger.warn('Gmail push notification data parsing failed', {
          correlationId,
          error: parseError instanceof Error ? parseError.message : 'Unknown error',
          action: 'gmail_push_parse_failed'
        });
      }
    }
    
    // Extract email address and historyId from notification
    const emailAddress = notificationData.emailAddress || attributes.emailAddress;
    const historyId = notificationData.historyId || attributes.historyId;
    
    logger.info('Gmail push notification data extracted', {
      correlationId,
      emailAddress,
      historyId,
      hasData: !!dataB64,
      action: 'gmail_push_data_extracted'
    });
    
    if (!emailAddress) {
      logger.warn('Gmail push notification missing email address', {
        correlationId,
        attributes,
        notificationData,
        action: 'gmail_push_missing_email'
      });
      return new Response('OK'); // Return OK to prevent retries
    }

    // Find the email account for this Gmail address
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        email: emailAddress, // Direct email match
        provider: 'google'
      },
      include: {
        org: true
      }
    });

    if (!emailAccount) {
      logger.warn('Gmail push notification for unknown email account', {
        correlationId,
        emailAddress,
        action: 'gmail_push_unknown_account'
      });
      return new Response('OK');
    }

    // Check for duplicate notifications by comparing historyId
    const currentHistoryId = emailAccount.historyId ? parseInt(emailAccount.historyId) : 0;
    const newHistoryId = historyId ? parseInt(historyId) : 0;
    
    if (newHistoryId > 0 && currentHistoryId > 0 && newHistoryId <= currentHistoryId) {
      logger.info('Gmail push notification duplicate detected', {
        correlationId,
        emailAddress,
        currentHistoryId: emailAccount.historyId,
        notificationHistoryId: historyId,
        action: 'gmail_push_duplicate'
      });
      return new Response('OK'); // Accept but don't process
    }

    logger.info('Gmail push notification processing', {
      correlationId,
      emailAddress,
      historyId,
      orgId: emailAccount.orgId,
      accountId: emailAccount.id,
      action: 'gmail_push_processing'
    });

    // Update last push received timestamp and log for monitoring
    await prisma.emailAccount.update({
      where: { id: emailAccount.id },
      data: { lastPushReceivedAt: new Date() }
    });

    // Log push notification for health monitoring
    await prisma.pushNotificationLog.create({
      data: {
        emailAccountId: emailAccount.id,
        orgId: emailAccount.orgId,
        provider: 'google',
        historyId,
        latencyMs: Date.now() - startTime,
        success: true
      }
    });
    
    // If we have historyId, do incremental sync, otherwise full sync
    if (historyId && emailAccount.historyId) {
      try {
        const gmailService = await GmailService.createFromAccount(emailAccount.orgId, emailAccount.id);
        await gmailService.handlePushNotification(emailAccount.orgId, emailAccount.id, historyId);
        
        logger.info('Gmail push notification real-time sync successful', {
          correlationId,
          emailAddress,
          historyId,
          action: 'gmail_push_realtime_success'
        });
      } catch (error: unknown) {
        // Check if it's an authentication error
        if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
          logger.error('Gmail push notification authentication failed', {
            correlationId,
            emailAddress,
            error: error.message,
            action: 'gmail_push_auth_failed'
          });
          
          // Update account status
          await prisma.emailAccount.update({
            where: { id: emailAccount.id },
            data: { status: 'action_needed' }
          });
        } else {
          logger.warn('Gmail push notification real-time sync failed, falling back to queued sync', {
            correlationId,
            emailAddress,
            error: error.message,
            action: 'gmail_push_realtime_fallback'
          });
        }
        
        // Always fall back to queued sync on any error
        await enqueueEmailSync(emailAccount.orgId, emailAccount.id);
      }
    } else {
      // Fall back to queued full sync
      logger.info('Gmail push notification using queued sync', {
        correlationId,
        emailAddress,
        reason: historyId ? 'no_stored_history' : 'no_history_id',
        action: 'gmail_push_queued_sync'
      });
      await enqueueEmailSync(emailAccount.orgId, emailAccount.id);
    }
    
    const latency = Date.now() - startTime;
    logger.info('Gmail push notification processed successfully', {
      correlationId,
      emailAddress,
      latency,
      action: 'gmail_push_success'
    });
    
    return new Response('OK');
  } catch (err: unknown) {
    const latency = Date.now() - startTime;
    logger.error('Gmail push notification processing failed', {
      correlationId,
      error: err.message,
      latency,
      action: 'gmail_push_failed'
    });

    // Try to log failed push notification if we have account info
    try {
      const body = await req.json().catch(() => null) as unknown;
      const message = body?.message;
      const attributes = message?.attributes ?? {};
      const emailAddress = attributes.emailAddress;
      
      if (emailAddress) {
        const emailAccount = await prisma.emailAccount.findFirst({
          where: { email: emailAddress, provider: 'google' }
        });
        
        if (emailAccount) {
          await prisma.pushNotificationLog.create({
            data: {
              emailAccountId: emailAccount.id,
              orgId: emailAccount.orgId,
              provider: 'google',
              latencyMs: latency,
              success: false,
              errorMessage: err.message
            }
          });
        }
      }
    } catch (logError) {
      // Don't fail if logging fails
      console.warn('Failed to log push notification error:', logError);
    }

    return new Response('OK'); // Return OK to prevent retries
  }
}


