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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50'); // Increased default limit
    const filter = url.searchParams.get('filter') || 'all';
    const offset = (page - 1) * limit;

    // Build where clause based on filter
    const whereClause: any = {
      orgId
      // Removed messages requirement to show all threads
    };

    // Apply filters based on thread properties
    switch (filter) {
      case 'unread':
        whereClause.unread = true;
        break;
      case 'starred':
        whereClause.starred = true;
        break;
      case 'attachments':
        // whereClause.messages = { some: { attachments: { some: {} } } }; // Not implemented yet
        break;
    }

    // Build filter conditions
    let filterCondition = '';
    if (filter === 'unread') {
      filterCondition = 'AND et.unread = true';
    } else if (filter === 'starred') {
      filterCondition = 'AND et.starred = true';
    }

    // Get threads with proper sorting by latest message date
    const threadsQuery = `
      SELECT 
        et.id,
        et."orgId",
        et."accountId",
        et."subjectEnc",
        et."participantsEnc",
        et."subjectIndex",
        et."participantsIndex",
        et."createdAt",
        et."updatedAt",
        et.labels,
        et.starred,
        et.unread,
        MAX(em."sentAt") as latest_message_date,
        COUNT(em.id) as message_count
      FROM "EmailThread" et
      LEFT JOIN "EmailMessage" em ON et.id = em."threadId"
      WHERE et."orgId" = $1
      ${filterCondition}
      GROUP BY et.id, et."orgId", et."accountId", et."subjectEnc", et."participantsEnc", 
               et."subjectIndex", et."participantsIndex", et."createdAt", et."updatedAt", 
               et.labels, et.starred, et.unread
      ORDER BY latest_message_date DESC NULLS LAST
      LIMIT $2 OFFSET $3
    `;
    
    const threads = await prisma.$queryRawUnsafe(threadsQuery, orgId, limit, offset);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT et.id) as total
      FROM "EmailThread" et
      WHERE et."orgId" = $1
      ${filterCondition}
    `;
    
    const totalCountResult = await prisma.$queryRawUnsafe(countQuery, orgId);
    const totalCount = Number((totalCountResult as any)[0]?.total || 0);

    // Transform to UI format
    const threadsFormatted = (threads as any[]).map((thread: any) => {
      // Parse participants from participantsIndex - handle space-separated format
      let participants = [{ name: 'Unknown', email: 'unknown@example.com' }];
      
      if (thread.participantsIndex) {
        // Split by spaces and filter out empty strings, then extract emails
        const parts = thread.participantsIndex.split(/\s+/).filter((p: string) => p.trim());
        const emails = parts.filter((part: string) => part.includes('@'));
        
        if (emails.length > 0) {
          participants = emails.map((email: string) => ({
            name: email.split('@')[0] || 'Unknown',
            email: email.trim()
          }));
        }
      }
      
      // Create a better snippet from the thread data
      let snippet = 'Email content available';
      if (thread.participantsIndex) {
        const parts = thread.participantsIndex.split(/\s+/).filter((p: string) => p.trim());
        const emails = parts.filter((part: string) => part.includes('@'));
        if (emails.length > 0) {
          snippet = `From: ${emails[0] || 'Unknown'} | To: ${emails.slice(1).join(', ') || 'Unknown'}`;
        }
      }
      
      return {
        id: thread.id,
        subject: thread.subjectIndex || 'Email from ' + (participants[0]?.name || participants[0]?.email || 'Unknown'),
        snippet: snippet,
        participants: participants,
        messageCount: Number(thread.message_count) || 0,
        unread: thread.unread || false,
        starred: thread.starred || false,
        hasAttachments: false, // Not implemented yet
        labels: thread.labels || [],
        lastMessageAt: thread.latest_message_date?.toISOString() || thread.updatedAt.toISOString(),
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
    logger.error('Failed to fetch threads', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return NextResponse.json(
      { error: 'Failed to fetch threads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}