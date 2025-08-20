import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const orgId = (session as { orgId?: string }).orgId;

    if (!orgId || orgId === 'unknown') {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // Get the thread ID from query params
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json({ error: "threadId parameter required" }, { status: 400 });
    }

    // Try to find the thread
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' }
        }
      }
    });

    if (!thread) {
      return NextResponse.json({ 
        error: "Thread not found",
        searchedThreadId: threadId,
        availableThreads: await prisma.emailThread.findMany({
          where: { orgId },
          select: { id: true, subjectIndex: true }
        })
      }, { status: 404 });
    }

    // Check if thread belongs to user's org
    if (thread.orgId !== orgId) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      thread: {
        id: thread.id,
        orgId: thread.orgId,
        accountId: thread.accountId,
        subjectIndex: thread.subjectIndex,
        participantsIndex: thread.participantsIndex,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        messageCount: thread.messages.length,
        messages: thread.messages.map(msg => ({
          id: msg.id,
          messageId: msg.messageId,
          subjectIndex: msg.subjectIndex,
          participantsIndex: msg.participantsIndex,
          sentAt: msg.sentAt,
          createdAt: msg.createdAt
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to get thread", 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
