import { NextRequest, NextResponse } from 'next/server';
import { emailWorkflowService } from '@/server/email-workflow';
import { prisma } from '@/server/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authenticity (implement proper verification in production)
    const body = await request.json();
    
    logger.info('Gmail webhook received', {
      body,
      headers: Object.fromEntries(request.headers.entries()),
      action: 'gmail_webhook_received'
    });

    // Extract data from Gmail webhook
    const { message } = body;
    if (!message?.data) {
      logger.warn('Invalid Gmail webhook payload', {
        body,
        action: 'gmail_webhook_invalid'
      });
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    // Decode the message data
    const messageData = JSON.parse(
      Buffer.from(message.data, 'base64').toString('utf-8')
    );

    const { emailAddress, historyId } = messageData;

    logger.info('Gmail webhook decoded', {
      emailAddress,
      historyId,
      action: 'gmail_webhook_decoded'
    });

    // Find the email account
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        email: emailAddress,
        provider: 'google'
      },
      include: { org: true }
    });

    if (!emailAccount) {
      logger.warn('Email account not found for webhook', {
        emailAddress,
        action: 'gmail_webhook_account_not_found'
      });
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    // Process the webhook
    await emailWorkflowService.handleGmailWebhook(
      emailAccount.orgId,
      emailAccount.id,
      historyId
    );

    logger.info('Gmail webhook processed successfully', {
      orgId: emailAccount.orgId,
      emailAccountId: emailAccount.id,
      historyId,
      action: 'gmail_webhook_processed'
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Gmail webhook processing failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      action: 'gmail_webhook_error'
    });

    return NextResponse.json({
      success: false,
      error: 'Webhook processing failed'
    }, { status: 500 });
  }
}

// Gmail requires GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hub_challenge = searchParams.get('hub.challenge');
    const hub_mode = searchParams.get('hub.mode');
    const hub_verify_token = searchParams.get('hub.verify_token');

    logger.info('Gmail webhook verification', {
      hub_mode,
      hub_verify_token: hub_verify_token ? '[REDACTED]' : null,
      hub_challenge: hub_challenge ? '[PRESENT]' : null,
      action: 'gmail_webhook_verification'
    });

    // In production, verify the token matches your expected value
    if (hub_mode === 'subscribe' && hub_verify_token === process.env.GMAIL_WEBHOOK_VERIFY_TOKEN) {
      return new NextResponse(hub_challenge);
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  } catch (error) {
    logger.error('Gmail webhook verification failed', {
      error: error instanceof Error ? error.message : String(error),
      action: 'gmail_webhook_verification_error'
    });

    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}