import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

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

    // Get sample threads with participant data
    const sampleThreads = await prisma.$queryRawUnsafe(`
      SELECT 
        et.id,
        et."subjectIndex",
        et."participantsIndex",
        et."subjectEnc",
        et."participantsEnc",
        MAX(em."sentAt") as latest_message_date,
        COUNT(em.id) as message_count
      FROM "EmailThread" et
      LEFT JOIN "EmailMessage" em ON et.id = em."threadId"
      WHERE et."orgId" = $1
      GROUP BY et.id, et."subjectIndex", et."participantsIndex", et."subjectEnc", et."participantsEnc"
      ORDER BY latest_message_date DESC NULLS LAST
      LIMIT 10
    `, orgId);

    // Test participant parsing on each thread
    const parsedResults = (sampleThreads as any[]).map((thread: any) => {
      let participants = [{ name: 'Unknown', email: 'unknown@example.com' }];
      
      if (thread.participantsIndex) {
        // Extract email addresses using regex
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const emails = thread.participantsIndex.match(emailRegex) || [];
        
        if (emails.length > 0) {
          participants = emails.map((email: string) => {
            const emailLower = email.toLowerCase();
            const name = email.split('@')[0];
            const cleanName = name
              .replace(/[._-]/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase())
              .trim();
            
            return {
              name: cleanName || 'Unknown',
              email: emailLower
            };
          });
        }
      }

      return {
        threadId: thread.id,
        subjectIndex: thread.subjectIndex,
        participantsIndex: thread.participantsIndex,
        participantsIndexLength: thread.participantsIndex?.length || 0,
        parsedParticipants: participants,
        messageCount: Number(thread.message_count) || 0,
        latestMessageDate: thread.latest_message_date
      };
    });

    return NextResponse.json({
      orgId,
      totalThreads: parsedResults.length,
      parsedResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to test participant parsing:', error);
    return NextResponse.json(
      { error: 'Failed to test participant parsing', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
