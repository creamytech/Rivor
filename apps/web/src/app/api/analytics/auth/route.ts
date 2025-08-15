import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { rateLimit, getClientIP, createRateLimitKey } from '@/lib/rate-limit';

export async function POST(_request: NextRequest) {
  try {
    // Rate limit analytics requests
    const ip = getClientIP(request);
    const rateLimitKey = createRateLimitKey(ip, 'analytics');
    const rateLimitResult = rateLimit(rateLimitKey, {
      maxAttempts: 100, // Allow more analytics requests
      windowMs: 60 * 1000 // 1 minute
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate the analytics event structure
    if (!body.event || typeof body.event !== 'string') {
      return NextResponse.json(
        { error: 'Invalid event format' },
        { status: 400 }
      );
    }

    // Sanitize and enhance the event data
    const analyticsEvent = {
      event: body.event,
      userId: body.userId,
      provider: body.provider,
      correlationId: body.correlationId,
      duration: body.duration,
      metadata: {
        ...body.metadata,
        ip: ip, // Will be hashed by logger
        timestamp: new Date().toISOString(),
        source: 'client'
      }
    };

    // Log for server-side analytics processing
    logger.info('Auth Analytics Event', {
      action: 'analytics_event',
      event: analyticsEvent.event,
      provider: analyticsEvent.provider,
      correlationId: analyticsEvent.correlationId,
      duration: analyticsEvent.duration,
      metadata: analyticsEvent.metadata
    });

    // Here you could also send to external analytics services
    // await sendToPostHog(analyticsEvent);
    // await sendToMixpanel(analyticsEvent);
    // await sendToDataWarehouse(analyticsEvent);

    return NextResponse.json({ success: true });
    
  } catch (error) {
    logger.error('Analytics endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
