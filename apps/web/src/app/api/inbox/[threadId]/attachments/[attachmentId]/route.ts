import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';
import { GmailService } from '@/server/gmail';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string; attachmentId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { threadId, attachmentId } = params;

    // Verify thread belongs to org
    const thread = await prisma.emailThread.findFirst({
      where: { id: threadId, orgId }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
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

    // Get attachment from Gmail API
    const attachment = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: threadId,
      id: attachmentId
    });

    if (!attachment.data) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Decode attachment data
    const attachmentData = Buffer.from(attachment.data.data || '', 'base64');

    logger.info('Attachment downloaded', { 
      threadId, 
      attachmentId, 
      orgId 
    });

    // Return attachment with appropriate headers
    return new Response(attachmentData, {
      headers: {
        'Content-Type': attachment.data.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${attachment.data.filename || 'attachment'}"`,
        'Content-Length': attachmentData.length.toString()
      }
    });

  } catch (error) {
    logger.error('Failed to download attachment', { error });
    return NextResponse.json(
      { error: 'Failed to download attachment' },
      { status: 500 }
    );
  }
}
