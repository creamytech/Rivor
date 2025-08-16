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

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const filter = url.searchParams.get('filter') || 'all';
    const offset = (page - 1) * limit;

    // Build where clause based on filter
    const whereClause: any = {
      orgId
      // Removed messages requirement to show all threads
    };

    // Note: Current schema doesn't support these filters yet
    // They will be added when we implement the full email features
    switch (filter) {
      case 'unread':
        // whereClause.unread = true; // Not implemented yet
        break;
      case 'starred':
        // whereClause.starred = true; // Not implemented yet
        break;
      case 'attachments':
        // whereClause.messages = { some: { attachments: { some: {} } } }; // Not implemented yet
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
            subjectIndex: true,
            participantsIndex: true,
            sentAt: true,
            htmlBody: true,
            textBody: true,
            snippet: true
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
      
      // Parse participants from participantsIndex
      const participants = latestMessage?.participantsIndex 
        ? latestMessage.participantsIndex.split(',').map((p: string) => p.trim()).map((email: string) => ({
            name: email.split('@')[0], // Use email prefix as name
            email: email
          }))
        : [{ name: 'Unknown', email: 'unknown@example.com' }];
      
      // Create a better snippet from the message data
      let snippet = 'Email content available';
      if (latestMessage?.snippet) {
        snippet = latestMessage.snippet;
      } else if (latestMessage?.participantsIndex) {
        const emails = latestMessage.participantsIndex.split(',').map((p: string) => p.trim());
        snippet = `From: ${emails[0] || 'Unknown'} | To: ${emails.slice(1).join(', ') || 'Unknown'}`;
      }
      
      return {
        id: thread.id,
        subject: latestMessage?.subjectIndex || thread.subjectIndex || 'Email from ' + (participants[0]?.name || participants[0]?.email || 'Unknown'),
        snippet: snippet,
        participants: participants,
        messageCount: thread._count.messages,
        unread: false, // Not implemented yet
        starred: false, // Not implemented yet
        hasAttachments: false, // Not implemented yet
        labels: [], // Not implemented yet
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

  } catch (error: unknown) {
    console.error('Inbox threads API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}