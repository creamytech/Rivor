import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { GmailService } from '@/server/gmail';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

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

    const { to, subject, body } = await req.json();

    // Validate required fields
    if (!to || !subject || !body) {
      return NextResponse.json({ 
        error: 'Missing required fields: to, subject, body' 
      }, { status: 400 });
    }

    // Get email account
    const emailAccount = await prisma.emailAccount.findFirst({
      where: { orgId, provider: 'google', status: 'connected' }
    });

    if (!emailAccount) {
      return NextResponse.json({ 
        error: 'No connected email account found' 
      }, { status: 400 });
    }

    // Create Gmail service
    const gmailService = await GmailService.createFromAccount(orgId, emailAccount.id);

    // Test email data
    const testEmailData = {
      to: to || 'test@example.com',
      subject: subject || 'Test Email from Rivor',
      body: body || 'This is a test email sent from the Rivor application.',
      isHtml: true
    };

    // Send test email
    const result = await gmailService.sendEmail(testEmailData);

    logger.info('Test email sent successfully', { 
      messageId: result.id,
      to: testEmailData.to,
      subject: testEmailData.subject,
      orgId 
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      result: {
        messageId: result.id,
        to: testEmailData.to,
        subject: testEmailData.subject,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to send test email', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return NextResponse.json(
      { 
        error: 'Failed to send test email', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

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

    // Get email account status
    const emailAccount = await prisma.emailAccount.findFirst({
      where: { orgId, provider: 'google' }
    });

    return NextResponse.json({
      success: true,
      emailAccount: emailAccount ? {
        id: emailAccount.id,
        email: emailAccount.email,
        status: emailAccount.status,
        provider: emailAccount.provider,
        hasTokenRef: !!emailAccount.tokenRef
      } : null,
      canSendEmails: emailAccount?.status === 'connected',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to check email send status', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return NextResponse.json(
      { error: 'Failed to check email send status' },
      { status: 500 }
    );
  }
}
