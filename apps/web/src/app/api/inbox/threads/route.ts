import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { decryptForOrg } from '@/server/crypto';
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

    // Transform to UI format - process each thread
    const threadsFormatted = await Promise.all((threads as any[]).map(async (thread: any) => {
      // Get the latest message for this thread to extract real data
      const latestMessage = await prisma.emailMessage.findFirst({
        where: { threadId: thread.id },
        select: {
          subjectEnc: true,
          fromEnc: true,
          toEnc: true,
          ccEnc: true,
          bccEnc: true,
          sentAt: true
        },
        orderBy: { sentAt: 'desc' }
      });

      // Decrypt sensitive data for display
      let participants: Array<{ name: string; email: string }> = [];
      let subject = 'No Subject';
      
      try {
        // Decrypt subject from message
        if (latestMessage?.subjectEnc) {
          const subjectBytes = await decryptForOrg(orgId, latestMessage.subjectEnc, 'email:subject');
          subject = new TextDecoder().decode(subjectBytes);
        }
        
        // Decrypt and parse participants
        if (latestMessage?.fromEnc) {
          const fromBytes = await decryptForOrg(orgId, latestMessage.fromEnc, 'email:from');
          const from = new TextDecoder().decode(fromBytes);
          
          // Parse from field
          const fromMatch = from.match(/([^<]+)<([^>]+)>/) || [null, from, from];
          const fromName = fromMatch[1]?.trim() || from.split('@')[0];
          const fromEmail = fromMatch[2] || from;
          
          participants.push({
            name: fromName,
            email: fromEmail.toLowerCase()
          });
        }
        
        // Decrypt and add to/cc recipients
        if (latestMessage?.toEnc) {
          const toBytes = await decryptForOrg(orgId, latestMessage.toEnc, 'email:to');
          const to = new TextDecoder().decode(toBytes);
          
          // Parse multiple recipients
          const toEmails = to.split(',').map(e => e.trim());
          for (const email of toEmails) {
            if (email && email !== participants[0]?.email) {
              const emailMatch = email.match(/([^<]+)<([^>]+)>/) || [null, email, email];
              const name = emailMatch[1]?.trim() || email.split('@')[0];
              const emailAddr = emailMatch[2] || email;
              
              participants.push({
                name: name,
                email: emailAddr.toLowerCase()
              });
            }
          }
        }
        
      } catch (error) {
        console.error('Failed to decrypt email data:', error);
        // Fallback to default values
        participants = [{ 
          name: 'Email Contact', 
          email: 'contact@example.com' 
        }];
      }
      
      // If no participants found, create a default one
      if (participants.length === 0) {
        participants = [{ 
          name: 'Email Contact', 
          email: 'contact@example.com' 
        }];
      }
      
      // Create a better snippet showing the conversation
      let snippet = 'Email content available';
      if (participants.length > 1) {
        const from = participants[0]?.name || participants[0]?.email || 'Unknown';
        const to = participants.slice(1).map((p: any) => p.name || p.email).join(', ') || 'Unknown';
        snippet = `From: ${from} | To: ${to}`;
      } else if (participants.length === 1) {
        snippet = `From: ${participants[0]?.name || participants[0]?.email || 'Unknown'}`;
      }
      
      return {
        id: thread.id,
        subject: subject,
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
    }));

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