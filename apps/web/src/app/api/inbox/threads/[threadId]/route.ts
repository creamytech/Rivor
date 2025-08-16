import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

/**
 * Get specific thread with all messages
 */
export async function GET(req: NextRequest, { params }: { params: { threadId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { threadId } = params;

    // Check if this is a demo thread
    if (threadId.startsWith('demo-')) {
      // Return demo thread data
      const demoThread = {
        id: threadId,
        subject: 'Demo Email Thread',
        labels: ['important'],
        starred: false,
        unread: false,
        participants: [
          { name: 'Demo User', email: 'demo@example.com' }
        ],
        messages: [{
          id: 'demo-message-1',
          subject: 'Demo Email Thread',
          from: { name: 'Demo User', email: 'demo@example.com' },
          to: [{ name: 'You', email: session.user.email! }],
          textBody: 'This is a demo email message. In a real implementation, this would show actual email content from your Gmail account.',
          sentAt: new Date().toISOString(),
          receivedAt: new Date().toISOString()
        }]
      };
      
      return NextResponse.json(demoThread);
    }

    const thread = await prisma.emailThread.findFirst({
      where: {
        id: threadId,
        orgId
      },
      include: {
        messages: {
          orderBy: { sentAt: 'asc' }
        }
      }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Transform to UI format using current schema
    const threadFormatted = {
      id: thread.id,
      subject: thread.subjectIndex || '(No subject)',
      labels: [], // Not implemented in current schema
      starred: false, // Not implemented in current schema
      unread: false, // Not implemented in current schema
      participants: thread.messages.reduce((acc: any[], message) => {
        // Parse participants from participantsIndex
        const participants = message.participantsIndex ? message.participantsIndex.split(',').map(p => p.trim()) : [];
        
        participants.forEach(email => {
          if (!acc.find(p => p.email === email)) {
            acc.push({
              name: email.split('@')[0], // Use email prefix as name
              email: email
            });
          }
        });
        
        return acc;
      }, []),
      messages: thread.messages.map(message => ({
        id: message.id,
        subject: message.subjectIndex || '(No subject)',
        from: {
          name: message.participantsIndex ? message.participantsIndex.split(',')[0].split('@')[0] : 'Unknown',
          email: message.participantsIndex ? message.participantsIndex.split(',')[0] : 'unknown@example.com'
        },
        to: message.participantsIndex ? message.participantsIndex.split(',').slice(1).map(email => ({
          name: email.split('@')[0],
          email: email.trim()
        })) : [],
        cc: [], // Not implemented in current schema
        bcc: [], // Not implemented in current schema
        htmlBody: '', // Not implemented in current schema
        textBody: 'Email content not available in current schema',
        attachments: [], // Not implemented in current schema
        sentAt: message.sentAt.toISOString(),
        receivedAt: message.createdAt.toISOString()
      }))
    };

    return NextResponse.json(threadFormatted);

  } catch (error: unknown) {
    console.error('Thread detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}

/**
 * Update thread (mark as read, star, etc.)
 */
export async function PATCH(req: NextRequest, { params }: { params: { threadId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { threadId } = params;
    const body = await req.json();

    // Skip demo threads
    if (threadId.startsWith('demo-')) {
      return NextResponse.json({ success: true });
    }

    // For now, just return success since these fields don't exist in current schema
    // TODO: Add these fields to the schema when implementing full email features
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Thread update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update thread' },
      { status: 500 }
    );
  }
}
