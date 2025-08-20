import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

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

    // Get total counts
    const totalThreads = await prisma.emailThread.count({ where: { orgId } });
    const totalMessages = await prisma.emailMessage.count({ where: { orgId } });
    const unreadThreads = await prisma.emailThread.count({ where: { orgId, unread: true } });
    const starredThreads = await prisma.emailThread.count({ where: { orgId, starred: true } });

    // Get recent threads with their latest message dates
    const recentThreads = await prisma.emailThread.findMany({
      where: { orgId },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: { sentAt: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    // Get threads sorted by latest message date
    const threadsByLatestMessage = await prisma.$queryRaw`
      SELECT 
        et.id,
        et."updatedAt",
        MAX(em."sentAt") as latest_message_date
      FROM "EmailThread" et
      LEFT JOIN "EmailMessage" em ON et.id = em."threadId"
      WHERE et."orgId" = ${orgId}
      GROUP BY et.id, et."updatedAt"
      ORDER BY latest_message_date DESC NULLS LAST
      LIMIT 10
    `;

    return NextResponse.json({
      orgId,
      counts: {
        totalThreads,
        totalMessages,
        unreadThreads,
        starredThreads
      },
      recentThreads: recentThreads.map(t => ({
        id: t.id,
        updatedAt: t.updatedAt,
        latestMessageDate: t.messages[0]?.sentAt || null
      })),
      threadsByLatestMessage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get inbox stats:', error);
    return NextResponse.json(
      { error: 'Failed to get inbox stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
