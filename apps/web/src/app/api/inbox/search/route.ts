import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (!query.trim()) {
      return NextResponse.json({ threads: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    // Search in threads and messages
    const threads = await prisma.emailThread.findMany({
      where: {
        orgId,
        OR: [
          {
            subjectIndex: {
              contains: query.toLowerCase()
            }
          },
          {
            participantsIndex: {
              contains: query.toLowerCase()
            }
          },
          {
            messages: {
              some: {
                OR: [
                  {
                    subjectIndex: {
                      contains: query.toLowerCase()
                    }
                  },
                  {
                    participantsIndex: {
                      contains: query.toLowerCase()
                    }
                  },
                  {
                    textBody: {
                      contains: query
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
            subjectIndex: true,
            participantsIndex: true,
            sentAt: true
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
      where: {
        orgId,
        OR: [
          {
            subjectIndex: {
              contains: query.toLowerCase()
            }
          },
          {
            participantsIndex: {
              contains: query.toLowerCase()
            }
          },
          {
            messages: {
              some: {
                OR: [
                  {
                    subjectIndex: {
                      contains: query.toLowerCase()
                    }
                  },
                  {
                    participantsIndex: {
                      contains: query.toLowerCase()
                    }
                  },
                  {
                    textBody: {
                      contains: query
                    }
                  }
                ]
              }
            }
          }
        ]
      }
    });

    // Transform to UI format
    const threadsFormatted = threads.map(thread => {
      const latestMessage = thread.messages[0];
      
      // Parse participants from participantsIndex
      let participants = [{ name: 'Unknown', email: 'unknown@example.com' }];
      
      if (latestMessage?.participantsIndex) {
        participants = latestMessage.participantsIndex.split(',').map((p: string) => p.trim()).map((email: string) => ({
          name: email.split('@')[0] || 'Unknown',
          email: email
        }));
      } else if (thread.participantsIndex) {
        participants = thread.participantsIndex.split(',').map((p: string) => p.trim()).map((email: string) => ({
          name: email.split('@')[0] || 'Unknown',
          email: email
        }));
      }
      
      // Create snippet
      let snippet = 'Email content available';
      if (latestMessage?.participantsIndex) {
        const emails = latestMessage.participantsIndex.split(',').map((p: string) => p.trim());
        snippet = `From: ${emails[0] || 'Unknown'} | To: ${emails.slice(1).join(', ') || 'Unknown'}`;
      } else if (thread.participantsIndex) {
        const emails = thread.participantsIndex.split(',').map((p: string) => p.trim());
        snippet = `From: ${emails[0] || 'Unknown'} | To: ${emails.slice(1).join(', ') || 'Unknown'}`;
      }
      
      return {
        id: thread.id,
        subject: latestMessage?.subjectIndex || thread.subjectIndex || 'Email from ' + (participants[0]?.name || participants[0]?.email || 'Unknown'),
        snippet: snippet,
        participants: participants,
        messageCount: thread._count.messages,
        unread: thread.unread || false,
        starred: thread.starred || false,
        hasAttachments: false, // Not implemented yet
        labels: thread.labels || [],
        lastMessageAt: latestMessage?.sentAt?.toISOString() || thread.updatedAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString()
      };
    });

    return NextResponse.json({
      threads: threadsFormatted,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    logger.error('Search failed', { error });
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
