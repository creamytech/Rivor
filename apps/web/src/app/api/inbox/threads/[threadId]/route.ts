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

    const orgId = (session as any).orgId;
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
          orderBy: { sentAt: 'asc' },
          include: {
            attachments: true
          }
        }
      }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Transform to UI format
    const threadFormatted = {
      id: thread.id,
      subject: thread.subject || '(No subject)',
      labels: thread.labels || [],
      starred: thread.starred,
      unread: thread.unread,
      participants: thread.messages.reduce((acc: any[], message) => {
        const participant = {
          name: message.fromName,
          email: message.fromEmail
        };
        
        if (!acc.find(p => p.email === participant.email)) {
          acc.push(participant);
        }
        
        return acc;
      }, []),
      messages: thread.messages.map(message => ({
        id: message.id,
        subject: message.subject,
        from: {
          name: message.fromName,
          email: message.fromEmail
        },
        to: message.toEmails ? JSON.parse(message.toEmails) : [],
        cc: message.ccEmails ? JSON.parse(message.ccEmails) : [],
        bcc: message.bccEmails ? JSON.parse(message.bccEmails) : [],
        htmlBody: message.htmlBody,
        textBody: message.textBody,
        attachments: message.attachments.map(att => ({
          id: att.id,
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size
        })),
        sentAt: message.sentAt.toISOString(),
        receivedAt: message.createdAt.toISOString()
      }))
    };

    return NextResponse.json(threadFormatted);

  } catch (error: any) {
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

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { threadId } = params;
    const body = await req.json();

    // Skip demo threads
    if (threadId.startsWith('demo-')) {
      return NextResponse.json({ success: true });
    }

    const updateData: any = {};

    if (body.unread !== undefined) {
      updateData.unread = body.unread;
    }

    if (body.starred !== undefined) {
      updateData.starred = body.starred;
    }

    if (body.labels !== undefined) {
      updateData.labels = body.labels;
    }

    const updatedThread = await prisma.emailThread.update({
      where: {
        id: threadId,
        orgId
      },
      data: updateData
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Thread update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update thread' },
      { status: 500 }
    );
  }
}
