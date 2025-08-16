import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { getThreadWithMessages } from '@/server/email';

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

    const orgId = (session as { orgId?: string }).orgId;
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

    // Use the email service to get properly decrypted content
    const { thread: emailThread, messages } = await getThreadWithMessages(orgId, threadId);

    if (!emailThread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Transform to UI format
    const threadFormatted = {
      id: emailThread.id,
      subject: emailThread.subject,
      labels: [], // Not implemented in current schema
      starred: false, // Not implemented in current schema
      unread: false, // Not implemented in current schema
      participants: emailThread.participants.split(',').map(p => p.trim()).map(email => ({
        name: email.split('@')[0], // Use email prefix as name
        email: email
      })),
      messages: messages.map(message => {
        // Parse participants for better display
        const fromEmail = message.from || 'unknown@example.com';
        const toEmails = message.to ? message.to.split(',').map(p => p.trim()) : [];
        
        return {
          id: message.id,
          subject: message.subject,
          from: {
            name: fromEmail.split('@')[0],
            email: fromEmail
          },
          to: toEmails.map(email => ({
            name: email.split('@')[0],
            email: email.trim()
          })),
          cc: message.cc ? message.cc.split(',').map(p => p.trim()).map(email => ({
            name: email.split('@')[0],
            email: email.trim()
          })) : [],
          bcc: message.bcc ? message.bcc.split(',').map(p => p.trim()).map(email => ({
            name: email.split('@')[0],
            email: email.trim()
          })) : [],
          htmlBody: message.body || 'No HTML content available',
          textBody: message.body || 'No text content available',
          attachments: [], // Not implemented in current schema
          sentAt: message.sentAt.toISOString(),
          receivedAt: message.sentAt.toISOString()
        };
      })
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

    const orgId = (session as { orgId?: string }).orgId;
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
