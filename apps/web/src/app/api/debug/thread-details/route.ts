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

    // Get a few sample threads with their raw data
    const sampleThreads = await prisma.$queryRawUnsafe(`
      SELECT 
        et.id,
        et."subjectIndex",
        et."participantsIndex",
        et."subjectEnc",
        et."participantsEnc",
        et.starred,
        et.unread,
        MAX(em."sentAt") as latest_message_date,
        COUNT(em.id) as message_count
      FROM "EmailThread" et
      LEFT JOIN "EmailMessage" em ON et.id = em."threadId"
      WHERE et."orgId" = $1
      GROUP BY et.id, et."subjectIndex", et."participantsIndex", et."subjectEnc", et."participantsEnc", et.starred, et.unread
      ORDER BY latest_message_date DESC NULLS LAST
      LIMIT 5
    `, orgId);

    // Get sample messages to check content
    const sampleMessages = await prisma.emailMessage.findMany({
      where: { orgId },
      select: {
        id: true,
        subjectIndex: true,
        participantsIndex: true,
        bodyRefEnc: true,
        snippetEnc: true,
        sentAt: true
      },
      orderBy: { sentAt: 'desc' },
      take: 3
    });

    return NextResponse.json({
      orgId,
      sampleThreads,
      sampleMessages,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get thread details:', error);
    return NextResponse.json(
      { error: 'Failed to get thread details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
