import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { mixWithDemoData, demoEmails } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

/**
 * Search inbox threads
 */
export async function GET(_req: NextRequest) {
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
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (!query || query.trim() === '') {
      return NextResponse.json({ threads: [], total: 0 });
    }

    // Search in database
    const threads = await prisma.emailThread.findMany({
      where: {
        orgId,
        OR: [
          {
            subject: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            messages: {
              some: {
                OR: [
                  {
                    subject: {
                      contains: query,
                      mode: 'insensitive'
                    }
                  },
                  {
                    textBody: {
                      contains: query,
                      mode: 'insensitive'
                    }
                  },
                  {
                    fromEmail: {
                      contains: query,
                      mode: 'insensitive'
                    }
                  },
                  {
                    fromName: {
                      contains: query,
                      mode: 'insensitive'
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
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
      take: limit
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

    // Search demo data if enabled
    const demoResults = demoEmails.filter(email => 
      email.subject.toLowerCase().includes(query.toLowerCase()) ||
      email.snippet.toLowerCase().includes(query.toLowerCase()) ||
      email.from.toLowerCase().includes(query.toLowerCase())
    ).map(email => ({
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
    }));

    const finalThreads = mixWithDemoData(threadsFormatted, demoResults);

    const response = {
      threads: finalThreads,
      total: finalThreads.length,
      query
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Inbox search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search threads' },
      { status: 500 }
    );
  }
}
