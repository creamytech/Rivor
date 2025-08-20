import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db-pool';
import { GoogleCalendarService } from '@/server/calendar';
import { logger } from '@/lib/logger';

// Force dynamic rendering - this route uses request headers
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const correlationId = `calendar-push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  try {
    logger.info('Calendar push notification received', {
      correlationId,
      action: 'calendar_push_received'
    });

    // Verify notification authenticity
    const token = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN;
    const provided = req.headers.get('x-goog-verification-token') || req.headers.get('x-verification-token');
    
    if (!token) {
      logger.warn('Calendar push verification token not configured', {
        correlationId,
        action: 'calendar_push_no_token'
      });
      return new Response('Server misconfigured', { status: 500 });
    }

    if (provided !== token) {
      logger.warn('Calendar push verification token mismatch', {
        correlationId,
        action: 'calendar_push_token_mismatch'
      });
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse the push notification body
    const body = await req.json();
    
    if (!body || !body.resourceId) {
      logger.warn('Calendar push notification missing resourceId', {
        correlationId,
        body,
        action: 'calendar_push_missing_resource'
      });
      return new Response('Bad Request', { status: 400 });
    }

    const resourceId = body.resourceId;
    
    // Find the calendar account that matches this resource
    // For now, we'll process all Google calendar accounts
    // In a more sophisticated setup, you'd store the resourceId mapping
    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: {
        provider: 'google',
        status: 'connected'
      }
    });

    if (calendarAccounts.length === 0) {
      logger.warn('No connected calendar accounts found for push notification', {
        correlationId,
        resourceId,
        action: 'calendar_push_no_accounts'
      });
      return new Response('No accounts found', { status: 404 });
    }

    // Process push notification for each account
    const processingPromises = calendarAccounts.map(async (account) => {
      try {
        const calendarService = await GoogleCalendarService.createFromAccount(account.orgId, account.id);
        await calendarService.handlePushNotification(account.orgId, account.id, resourceId);
        
        logger.info('Calendar push notification processed successfully', {
          correlationId,
          orgId: account.orgId,
          calendarAccountId: account.id,
          resourceId,
          processingTime: Date.now() - startTime,
          action: 'calendar_push_processed'
        });
        
        return { success: true, accountId: account.id };
      } catch (error) {
        logger.error('Failed to process calendar push notification', {
          correlationId,
          orgId: account.orgId,
          calendarAccountId: account.id,
          resourceId,
          error: error instanceof Error ? error.message : String(error),
          action: 'calendar_push_processing_failed'
        });
        
        return { success: false, accountId: account.id, error: error instanceof Error ? error.message : String(error) };
      }
    });

    const results = await Promise.all(processingPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    logger.info('Calendar push notification processing completed', {
      correlationId,
      totalAccounts: calendarAccounts.length,
      successful,
      failed,
      totalProcessingTime: Date.now() - startTime,
      action: 'calendar_push_completed'
    });

    // Return success if at least one account was processed successfully
    if (successful > 0) {
      return new Response('OK', { status: 200 });
    } else {
      return new Response('Processing failed', { status: 500 });
    }

  } catch (error) {
    logger.error('Calendar push notification handler error', {
      correlationId,
      error: error instanceof Error ? error.message : String(error),
      action: 'calendar_push_handler_error'
    });
    
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Handle GET requests for webhook validation
export async function GET(req: NextRequest) {
  const correlationId = `calendar-validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('Calendar webhook validation request received', {
      correlationId,
      action: 'calendar_webhook_validation'
    });

    // Some webhook services send a validation request
    // For Google Calendar, this is typically not used, but we'll handle it
    const { searchParams } = new URL(req.url);
    const challenge = searchParams.get('challenge');
    
    if (challenge) {
      logger.info('Calendar webhook validation challenge responded', {
        correlationId,
        challenge,
        action: 'calendar_webhook_challenge'
      });
      return new Response(challenge, { 
        status: 200, 
        headers: { 'Content-Type': 'text/plain' } 
      });
    }

    return new Response('OK', { status: 200 });
  } catch (error: unknown) {
    logger.error('Calendar webhook validation failed', {
      correlationId,
      error: error instanceof Error ? error.message : String(error),
      action: 'calendar_webhook_validation_failed'
    });

    return new Response('Validation failed', { status: 500 });
  }
}
