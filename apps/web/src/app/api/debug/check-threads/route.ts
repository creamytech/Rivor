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

    // Test different queries
    const totalThreads = await prisma.emailThread.count({ where: { orgId } });
    const totalMessages = await prisma.emailMessage.count({ where: { orgId } });
    
    // Test the exact query from dashboard
    const threads = await prisma.emailThread.findMany({
      where: { orgId },
      include: {
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    // Test a simpler query
    const simpleThreads = await prisma.emailThread.findMany({
      where: { orgId },
      take: 5
    });

    return NextResponse.json({
      success: true,
      orgId,
      stats: {
        totalThreads,
        totalMessages
      },
      complexQuery: {
        found: threads.length,
        threads: threads.map(t => ({
          id: t.id,
          updatedAt: t.updatedAt,
          messageCount: t._count.messages
        }))
      },
      simpleQuery: {
        found: simpleThreads.length,
        threads: simpleThreads.map(t => ({
          id: t.id,
          updatedAt: t.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('Debug threads error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
