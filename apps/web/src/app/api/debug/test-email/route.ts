import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { GmailService } from '@/server/gmail';
import { prisma } from '@/lib/db-pool';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { to, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }

    // Get email account
    const emailAccount = await prisma.emailAccount.findFirst({
      where: { orgId, provider: 'google' }
    });

    if (!emailAccount) {
      return NextResponse.json({ error: 'No Gmail account found. Please connect Gmail first.' }, { status: 400 });
    }

    // Check account status
    if (emailAccount.status !== 'connected') {
      return NextResponse.json({ 
        error: `Gmail account not ready. Status: ${emailAccount.status}`,
        accountStatus: emailAccount.status,
        suggestion: 'Please reconnect your Gmail account in settings.'
      }, { status: 400 });
    }

    // Create Gmail service and send test email
    const gmailService = await GmailService.createFromAccount(orgId, emailAccount.id);
    
    const result = await gmailService.sendEmail({
      to,
      subject: `[Test] ${subject}`,
      body: `${body}\n\n---\nThis is a test email sent via Rivor Gmail integration.\nTime: ${new Date().toISOString()}`,
      isHtml: false
    });

    return NextResponse.json({
      success: true,
      messageId: result.id,
      accountInfo: {
        id: emailAccount.id,
        status: emailAccount.status,
        syncStatus: emailAccount.syncStatus
      },
      testDetails: {
        to,
        subject,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Test email error:', error);
    
    // Provide more detailed error information
    let errorDetails = 'Unknown error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Check for common Gmail API errors
      if (error.message.includes('Invalid credentials') || error.message.includes('401')) {
        errorDetails = 'Gmail authentication failed. Please reconnect your Gmail account.';
        statusCode = 401;
      } else if (error.message.includes('insufficient permissions') || error.message.includes('403')) {
        errorDetails = 'Insufficient Gmail permissions. Please check your OAuth scopes.';
        statusCode = 403;
      } else if (error.message.includes('quota exceeded') || error.message.includes('429')) {
        errorDetails = 'Gmail API quota exceeded. Please try again later.';
        statusCode = 429;
      }
    }

    return NextResponse.json({
      error: 'Failed to send test email',
      details: errorDetails,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: statusCode });
  }
}