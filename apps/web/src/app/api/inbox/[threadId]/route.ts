import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } }
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

    const threadId = params.threadId;

    // Get thread with messages
    const thread = await prisma.emailThread.findFirst({
      where: { id: threadId, orgId },
      include: {
        messages: {
          orderBy: { sentAt: 'asc' },
          select: {
            id: true,
            messageId: true,
            sentAt: true,
            subjectIndex: true,
            participantsIndex: true,
            textBody: true,
            htmlBody: true,
            snippet: true
          }
        }
      }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Transform to UI format
    const messages = thread.messages.map(message => {
      // Parse participants
      const participants = message.participantsIndex?.split(',').map(p => p.trim()) || [];
      const from = participants[0] || 'unknown@example.com';
      const to = participants.slice(1) || [];

      return {
        id: message.id,
        subject: message.subjectIndex || '(No subject)',
        from: {
          name: from.split('@')[0] || 'Unknown',
          email: from
        },
        to: to.map(email => ({
          name: email.split('@')[0] || 'Unknown',
          email: email
        })),
        cc: [],
        bcc: [],
        htmlBody: message.htmlBody,
        textBody: message.textBody || '',
        attachments: [], // Not implemented yet
        sentAt: message.sentAt.toISOString(),
        receivedAt: message.sentAt.toISOString()
      };
    });

    // Parse thread participants
    const threadParticipants = thread.participantsIndex?.split(',').map(p => p.trim()) || [];
    const participants = threadParticipants.map(email => ({
      name: email.split('@')[0] || 'Unknown',
      email: email
    }));

    const threadData = {
      id: thread.id,
      subject: thread.subjectIndex || '(No subject)',
      labels: thread.labels || [],
      starred: thread.starred || false,
      unread: thread.unread || false,
      messages: messages,
      participants: participants
    };

    return NextResponse.json(threadData);

  } catch (error) {
    logger.error('Failed to fetch thread', { error });
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}
