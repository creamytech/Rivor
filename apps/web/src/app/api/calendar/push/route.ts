import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { CalendarWebhookService } from '@/server/calendar-webhooks';
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

    // Validate notification headers
    const validation = CalendarWebhookService.validateNotification(req.headers);
    
    if (!validation.valid) {
      logger.warn('Calendar push notification validation failed', {
        correlationId,
        error: validation.error,
        action: 'calendar_push_validation_failed'
      });
      return NextResponse.json({ error: 'Invalid notification' }, { status: 400 });
    }

    const { channelId, resourceId, state } = validation;

    logger.info('Calendar push notification validated', {
      correlationId,
      channelId,
      resourceId,
      state,
      action: 'calendar_push_validated'
    });

    // Find the calendar account for this channel
    const calendarAccount = await prisma.calendarAccount.findFirst({
      where: {
        channelId: channelId,
        channelResourceId: resourceId
      },
      include: {
        org: true
      }
    });

    if (!calendarAccount) {
      logger.warn('Calendar push notification for unknown channel', {
        correlationId,
        channelId,
        resourceId,
        action: 'calendar_push_unknown_channel'
      });
      return NextResponse.json({ error: 'Unknown channel' }, { status: 404 });
    }

    // Check if channel is expired
    if (calendarAccount.channelExpiration && calendarAccount.channelExpiration < new Date()) {
      logger.warn('Calendar push notification for expired channel', {
        correlationId,
        channelId,
        resourceId,
        expiration: calendarAccount.channelExpiration,
        action: 'calendar_push_expired_channel'
      });
      return NextResponse.json({ error: 'Channel expired' }, { status: 410 });
    }

    logger.info('Calendar push notification processing', {
      correlationId,
      channelId,
      resourceId,
      state,
      orgId: calendarAccount.orgId,
      accountId: calendarAccount.id,
      action: 'calendar_push_processing'
    });

    // Handle different notification states
    if (state === 'sync') {
      // Initial sync notification - no action needed
      logger.info('Calendar push notification sync state - no action needed', {
        correlationId,
        channelId,
        action: 'calendar_push_sync_state'
      });
    } else if (state === 'exists') {
      // Resource updated - trigger calendar sync
      logger.info('Calendar push notification exists state - triggering sync', {
        correlationId,
        channelId,
        action: 'calendar_push_exists_state'
      });

      // TODO: Implement calendar sync queue
      // For now, we'll just log the event
      logger.info('Calendar sync would be triggered here', {
        correlationId,
        orgId: calendarAccount.orgId,
        accountId: calendarAccount.id,
        action: 'calendar_sync_todo'
      });
    } else {
      logger.info('Calendar push notification unknown state', {
        correlationId,
        channelId,
        state,
        action: 'calendar_push_unknown_state'
      });
    }

    const latency = Date.now() - startTime;
    logger.info('Calendar push notification processed successfully', {
      correlationId,
      channelId,
      resourceId,
      state,
      latency,
      action: 'calendar_push_success'
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const latency = Date.now() - startTime;
    logger.error('Calendar push notification processing failed', {
      correlationId,
      error: error.message,
      latency,
      action: 'calendar_push_failed'
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    logger.error('Calendar webhook validation failed', {
      correlationId,
      error: error.message,
      action: 'calendar_webhook_validation_failed'
    });

    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}
