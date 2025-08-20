import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';
import { GmailService } from '@/server/gmail';

export const dynamic = 'force-dynamic';

export async function POST(__request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const orgId = (session as { orgId?: string }).orgId;

    if (!orgId || orgId === 'unknown') {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    logger.info('Starting sync debug', { userEmail, orgId });

    // Get email account
    const emailAccount = await prisma.emailAccount.findFirst({
      where: { orgId, provider: 'google' }
    });

    if (!emailAccount) {
      return NextResponse.json({ error: "No Google email account found" }, { status: 400 });
    }

    // Test Gmail API connection
    const gmailService = await GmailService.createFromAccount(orgId, emailAccount.id);
    const gmail = await gmailService.getGmail();

    // Test getting messages list
    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 5, // Just get 5 messages for testing
      q: 'in:inbox OR in:sent',
    });

    const messages = messagesResponse.data.messages || [];
    
    logger.info('Found messages in Gmail', { 
      messageCount: messages.length,
      firstMessageId: messages[0]?.id 
    });

    // Test processing one message
    let processedMessage = null;
    if (messages.length > 0) {
      const firstMessageId = messages[0].id;
      
      // Get full message
      const messageResponse = await gmail.users.messages.get({
        userId: 'me',
        id: firstMessageId,
        format: 'full',
      });

      const message = messageResponse.data;
      
      // Extract basic info
      const headers = message.payload?.headers || [];
      const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      
      processedMessage = {
        id: message.id,
        subject: getHeader('Subject'),
        from: getHeader('From'),
        to: getHeader('To'),
        hasPayload: !!message.payload,
        hasBody: !!message.payload?.body,
        hasParts: !!message.payload?.parts,
        bodySize: message.payload?.body?.data ? Buffer.from(message.payload.body.data, 'base64').toString('utf-8').length : 0,
        partsCount: message.payload?.parts?.length || 0
      };
    }

    // Check existing messages in database
    const existingMessages = await prisma.emailMessage.findMany({
      where: { orgId },
      select: { id: true, messageId: true, subjectIndex: true, sentAt: true },
      take: 5
    });

    return NextResponse.json({
      success: true,
      debug: {
        orgId,
        userEmail,
        emailAccountId: emailAccount.id,
        gmailMessagesFound: messages.length,
        processedMessage,
        existingMessagesInDb: existingMessages.length,
        existingMessages: existingMessages.map(m => ({
          id: m.id,
          messageId: m.messageId,
          subjectIndex: m.subjectIndex,
          sentAt: m.sentAt
        }))
      }
    });

  } catch (error) {
    logger.error('Sync debug error', { error });
    return NextResponse.json(
      { error: 'Sync debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
