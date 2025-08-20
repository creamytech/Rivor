import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';
import { GmailService } from '@/server/gmail';
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

    const {
      to,
      cc,
      bcc,
      subject,
      body,
      threadId, // For replies
      isHtml = true
    } = await req.json();

    // Validate required fields
    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }

    // Get email account
    const emailAccount = await prisma.emailAccount.findFirst({
      where: { orgId, provider: 'google', status: 'connected' }
    });

    if (!emailAccount) {
      return NextResponse.json({ error: 'No connected email account found' }, { status: 400 });
    }

    // Create Gmail service
    const gmailService = await GmailService.createFromAccount(orgId, emailAccount.id);
    const gmail = await gmailService.getGmail();

    // Prepare email data
    const emailData = {
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
      subject,
      body,
      isHtml
    };

    // Send email via Gmail API
    const sentMessage = await gmailService.sendEmail(emailData);

    // Encrypt email data for storage
    const subjectEnc = await encryptForOrg(orgId, subject, 'email:subject');
    const bodyEnc = await encryptForOrg(orgId, body, 'email:body');
    const toEnc = await encryptForOrg(orgId, emailData.to, 'email:to');
    const ccEnc = cc ? await encryptForOrg(orgId, emailData.cc!, 'email:cc') : null;
    const bccEnc = bcc ? await encryptForOrg(orgId, emailData.bcc!, 'email:bcc') : null;
    const fromEnc = await encryptForOrg(orgId, emailAccount.email, 'email:from');

    // Create snippet from body
    const snippet = isHtml 
      ? body.replace(/<[^>]*>/g, '').substring(0, 200).replace(/\s+/g, ' ').trim()
      : body.substring(0, 200).replace(/\s+/g, ' ').trim();
    const snippetEnc = await encryptForOrg(orgId, snippet, 'email:snippet');

    let thread;
    if (threadId) {
      // Reply to existing thread
      thread = await prisma.emailThread.findUnique({
        where: { id: threadId, orgId }
      });
      
      if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
      }

      // Update thread's updatedAt
      await prisma.emailThread.update({
        where: { id: thread.id },
        data: { updatedAt: new Date() }
      });
    } else {
      // Create new thread
      const participantsEnc = await encryptForOrg(orgId, `${emailAccount.email}, ${emailData.to}`, 'email:participants');
      
      thread = await prisma.emailThread.create({
        data: {
          orgId,
          accountId: emailAccount.id,
          subjectEnc,
          participantsEnc,
          subjectIndex: subject.toLowerCase(),
          participantsIndex: `${emailAccount.email} ${emailData.to} ${emailData.cc || ''} ${emailData.bcc || ''}`.toLowerCase(),
        }
      });
    }

    // Save sent message to database
    const savedMessage = await prisma.emailMessage.create({
      data: {
        orgId,
        threadId: thread.id,
        messageId: sentMessage.id,
        sentAt: new Date(),
        subjectEnc,
        bodyRefEnc: bodyEnc,
        fromEnc,
        toEnc,
        ccEnc,
        bccEnc,
        snippetEnc,
        subjectIndex: subject.toLowerCase(),
        participantsIndex: `${emailAccount.email} ${emailData.to} ${emailData.cc || ''} ${emailData.bcc || ''}`.toLowerCase(),
      }
    });

    logger.info('Email sent successfully', { 
      messageId: sentMessage.id,
      threadId: thread.id,
      subject,
      to: emailData.to,
      orgId 
    });

    return NextResponse.json({
      success: true,
      message: {
        id: savedMessage.id,
        messageId: sentMessage.id,
        threadId: thread.id,
        subject,
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        body,
        sentAt: savedMessage.sentAt
      }
    });

  } catch (error) {
    logger.error('Failed to send email', { error });
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
