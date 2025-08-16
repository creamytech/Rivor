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

    // Get recent threads and messages
    const threads = await prisma.emailThread.findMany({
      where: { accountId: emailAccount.id },
      select: {
        id: true,
        subjectIndex: true,
        participantsIndex: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const messages = await prisma.emailMessage.findMany({
      where: {
        thread: {
          accountId: emailAccount.id
        }
      },
      select: {
        id: true,
        threadId: true,
        messageId: true,
        subjectIndex: true,
        participantsIndex: true,
        sentAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      success: true,
      emailAccount: {
        id: emailAccount.id,
        provider: emailAccount.provider,
        email: emailAccount.email,
        status: emailAccount.status,
        syncStatus: emailAccount.syncStatus,
        lastSyncedAt: emailAccount.lastSyncedAt,
        errorReason: emailAccount.errorReason
      },
      recentThreads: {
        total: threads.length,
        details: threads
      },
      recentMessages: {
        total: messages.length,
        details: messages
      },
      syncEndpoints: {
        oldSync: '/api/debug/direct-sync-simple',
        newSync: '/api/debug/sync-debug',
        threadCheck: '/api/debug/check-threads',
        threadLookup: '/api/debug/get-thread'
      },
      recommendations: [
        'The old sync endpoint is still being called somewhere',
        'Check if any frontend code is calling the old endpoint',
        'Use the new sync-debug endpoint instead',
        'Clear browser cache and try again'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to get sync status", 
      details: error.message
    }, { status: 500 });
  }
}
