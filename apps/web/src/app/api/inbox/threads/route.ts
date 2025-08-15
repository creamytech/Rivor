import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { mixWithDemoData, demoEmails } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

/**
 * Get inbox threads with pagination and filtering
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const filter = url.searchParams.get('filter') || 'all';
    const offset = (page - 1) * limit;

    // Build where clause based on filter
    let whereClause: any = {
      orgId,
      messages: {
        some: {} // Only threads with messages
      }
    };

    switch (filter) {
      case 'unread':
        whereClause.unread = true;
        break;
      case 'starred':
        whereClause.starred = true;
        break;
      case 'attachments':
        whereClause.messages = {
          some: {
            attachments: {
              some: {}
            }
          }
        };
        break;
    }

    // Get threads with message data
    const threads = await prisma.emailThread.findMany({
      where: whereClause,
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1, // Get latest message for preview
          select: {
            id: true,
            subject: true,
            snippet: true,
            fromEmail: true,
            fromName: true,
            sentAt: true,
            hasAttachments: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.emailThread.count({
      where: whereClause
    });

    // Transform to UI format
    const threadsFormatted = threads.map(thread => {
      const latestMessage = thread.messages[0];
      
      return {
        id: thread.id,
        subject: latestMessage?.subject || thread.subject || '(No subject)',
        snippet: latestMessage?.snippet || '',
        participants: [{
          name: latestMessage?.fromName || null,
          email: latestMessage?.fromEmail || 'unknown@example.com'
        }],
        messageCount: thread._count.messages,
        unread: thread.unread,
        starred: thread.starred,
        hasAttachments: latestMessage?.hasAttachments || false,
        labels: thread.labels || [],
        lastMessageAt: latestMessage?.sentAt?.toISOString() || thread.updatedAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString()
      };
    });

    // Mix with demo data if enabled
    const finalThreads = mixWithDemoData(threadsFormatted, demoEmails.map(email => ({
      id: email.id,
      subject: email.subject,
      snippet: email.snippet,
      participants: [{ name: null, email: email.from }],
      messageCount: 1,
      unread: email.unread,
      starred: false,
      hasAttachments: false,
      labels: email.labels,
      lastMessageAt: email.createdAt,
      updatedAt: email.createdAt
    })));

    const response = {
      threads: finalThreads,
      pagination: {
        page,
        limit,
        total: totalCount + (finalThreads.length - threadsFormatted.length), // Include demo data in count
        pages: Math.ceil((totalCount + (finalThreads.length - threadsFormatted.length)) / limit)
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Inbox threads API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}