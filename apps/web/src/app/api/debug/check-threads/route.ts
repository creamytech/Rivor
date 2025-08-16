import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

export async function GET(__request: NextRequest) {
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

    // Get user to find correct userId
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get EmailAccount for this user
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        orgId,
        userId: user.id,
        provider: 'google'
      }
    });

    if (!emailAccount) {
      return NextResponse.json({ error: "EmailAccount not found" }, { status: 404 });
    }

    // Get all threads for this account
    const threads = await prisma.emailThread.findMany({
      where: { accountId: emailAccount.id },
      select: {
        id: true,
        orgId: true,
        accountId: true,
        subjectIndex: true,
        participantsIndex: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true }
        }
      }
    });

    // Get all messages for this account
    const messages = await prisma.emailMessage.findMany({
      where: {
        thread: {
          accountId: emailAccount.id
        }
      },
      select: {
        id: true,
        orgId: true,
        threadId: true,
        messageId: true,
        subjectIndex: true,
        participantsIndex: true,
        sentAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Check for orphaned messages (messages without valid threads)
    const orphanedMessages = messages.filter(message => {
      return !threads.some(thread => thread.id === message.threadId);
    });

    // Check for empty threads (threads without messages)
    const emptyThreads = threads.filter(thread => {
      return !messages.some(message => message.threadId === thread.id);
    });

    return NextResponse.json({
      success: true,
      emailAccount: {
        id: emailAccount.id,
        provider: emailAccount.provider,
        email: emailAccount.email,
        status: emailAccount.status,
        syncStatus: emailAccount.syncStatus
      },
      threads: {
        total: threads.length,
        details: threads
      },
      messages: {
        total: messages.length,
        details: messages
      },
      issues: {
        orphanedMessages: orphanedMessages.length,
        emptyThreads: emptyThreads.length,
        orphanedMessageIds: orphanedMessages.map(m => m.id),
        emptyThreadIds: emptyThreads.map(t => t.id)
      },
      relationships: {
        validThreadMessagePairs: messages.filter(message => 
          threads.some(thread => thread.id === message.threadId)
        ).length,
        totalPossiblePairs: threads.length * messages.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to check threads", 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
