import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';
import { GmailService } from '@/server/gmail';

export const dynamic = 'force-dynamic';

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

    const { to, subject, body, threadId, type } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get email account
    const emailAccount = await prisma.emailAccount.findFirst({
      where: { orgId, provider: 'google' }
    });

    if (!emailAccount) {
      return NextResponse.json({ error: 'No email account found' }, { status: 400 });
    }

    // Create Gmail service
    const gmailService = await GmailService.createFromAccount(orgId, emailAccount.id);
    const gmail = await gmailService.getGmail();

    // Prepare email content
    const emailContent = {
      to: to,
      subject: subject,
      body: body,
      threadId: threadId // For replies
    };

    // Send email via Gmail API
    const message = {
      raw: Buffer.from(
        `To: ${emailContent.to}\r\n` +
        `Subject: ${emailContent.subject}\r\n` +
        `Content-Type: text/plain; charset=UTF-8\r\n` +
        `\r\n` +
        `${emailContent.body}`
      ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    };

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: message
    });

    if (response.data.id) {
      // If this is a reply, add the message to the existing thread
      if (threadId && type === 'reply') {
        // Create a new message in the existing thread
        await prisma.emailMessage.create({
          data: {
            orgId,
            threadId,
            messageId: response.data.id,
            sentAt: new Date(),
            subjectIndex: subject.toLowerCase(),
            participantsIndex: `${session.user.email} ${to}`.toLowerCase(),
            textBody: body,
            htmlBody: body.replace(/\n/g, '<br>'),
            snippet: body.substring(0, 200)
          }
        });

        // Update thread
        await prisma.emailThread.update({
          where: { id: threadId },
          data: { updatedAt: new Date() }
        });
      }

      logger.info('Email sent successfully', { 
        messageId: response.data.id, 
        to, 
        subject, 
        orgId 
      });

      return NextResponse.json({ 
        success: true, 
        messageId: response.data.id 
      });
    } else {
      throw new Error('Failed to send email');
    }

  } catch (error) {
    logger.error('Failed to send email', { error });
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
