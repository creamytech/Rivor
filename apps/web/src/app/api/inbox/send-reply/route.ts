import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';
import { GmailService } from '@/server/gmail';
import { getThreadWithMessages } from '@/server/email';
import { encryptForOrg } from '@/server/crypto';

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

    const { replyId, customContent } = await req.json();

    if (!replyId) {
      return NextResponse.json({ error: 'Reply ID required' }, { status: 400 });
    }

    // Get the AI suggested reply
    const reply = await prisma.aISuggestedReply.findUnique({
      where: { id: replyId },
      include: {
        email: {
          include: {
            thread: true
          }
        }
      }
    });

    if (!reply || !reply.email) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
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

    // Get thread with messages to extract original email details
    const threadData = await getThreadWithMessages(orgId, reply.threadId);
    const originalMessage = threadData.messages.find(m => m.id === reply.emailId) || threadData.messages[threadData.messages.length - 1];

    if (!originalMessage) {
      return NextResponse.json({ error: 'Original message not found' }, { status: 404 });
    }

    // Use custom content if provided, otherwise use AI suggested content
    const emailContent = customContent || reply.suggestedContent;
    
    // Parse from field to get recipient info
    const originalFrom = originalMessage.from;
    const fromMatch = originalFrom.match(/([^<]+)<([^>]+)>/) || [null, originalFrom, originalFrom];
    const recipientEmail = fromMatch[2] || originalFrom;
    const recipientName = fromMatch[1]?.trim() || recipientEmail;

    // Create subject line (Re: original subject)
    let replySubject = originalMessage.subject;
    if (replySubject && !replySubject.toLowerCase().startsWith('re:')) {
      replySubject = `Re: ${replySubject}`;
    }

    // Use the Gmail service's sendEmail method for better formatting and delivery
    const response = await gmailService.sendEmail({
      to: recipientEmail,
      subject: replySubject,
      body: emailContent,
      isHtml: false // For now, send as plain text - could be enhanced to detect HTML
    });

    if (response.id) {
      // Update reply status to sent
      await prisma.aISuggestedReply.update({
        where: { id: replyId },
        data: {
          status: 'sent',
          sentAt: new Date(),
          ...(customContent && { userModifications: customContent })
        }
      });

      // Encrypt message data for storage
      const subjectEnc = await encryptForOrg(orgId, replySubject, 'email:subject');
      const fromEnc = await encryptForOrg(orgId, session.user.email || '', 'email:from');
      const toEnc = await encryptForOrg(orgId, recipientEmail, 'email:to');
      const snippetEnc = await encryptForOrg(orgId, emailContent.substring(0, 200), 'email:snippet');
      
      // Store body content as text
      const bodyContent = JSON.stringify({ type: 'text', content: emailContent });
      const bodyEnc = await encryptForOrg(orgId, bodyContent, 'email:body');

      // Create a new message record in the thread
      await prisma.emailMessage.create({
        data: {
          orgId,
          threadId: reply.threadId,
          messageId: response.id,
          sentAt: new Date(),
          subjectEnc,
          fromEnc,
          toEnc,
          snippetEnc,
          bodyRefEnc: bodyEnc
        }
      });

      // Update thread timestamp
      await prisma.emailThread.update({
        where: { id: reply.threadId },
        data: { updatedAt: new Date() }
      });

      logger.info('AI reply sent successfully', {
        messageId: response.id,
        replyId,
        threadId: reply.threadId,
        to: recipientEmail,
        orgId
      });

      return NextResponse.json({
        success: true,
        messageId: response.id,
        sentAt: new Date().toISOString()
      });

    } else {
      throw new Error('Failed to send reply via Gmail API');
    }

  } catch (error) {
    logger.error('Failed to send AI reply', { error });
    console.error('Send reply error:', error);
    
    return NextResponse.json({
      error: 'Failed to send reply',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}