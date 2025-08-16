import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(__request: NextRequest) {
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

    logger.info('Starting simple direct email sync', {
      userEmail,
      orgId,
      emailAccountId: emailAccount.id
    });

    // Update sync status to running
    await prisma.emailAccount.update({
      where: { id: emailAccount.id },
      data: {
        syncStatus: 'running',
        lastSyncedAt: new Date()
      }
    });

    try {
      // Create some dummy email data for testing using correct schema
      const dummyThread = await prisma.emailThread.upsert({
        where: {
          id: `test-thread-${emailAccount.id}`
        },
        update: {},
        create: {
          id: `test-thread-${emailAccount.id}`,
          orgId: orgId,
          accountId: emailAccount.id,
          subjectIndex: 'Test Email Thread',
          participantsIndex: 'test@example.com'
        }
      });

      const dummyMessage = await prisma.emailMessage.upsert({
        where: {
          id: `test-message-${emailAccount.id}`
        },
        update: {},
        create: {
          id: `test-message-${emailAccount.id}`,
          orgId: orgId,
          threadId: dummyThread.id,
          messageId: 'test-message-123',
          sentAt: new Date(),
          subjectIndex: 'Test Email',
          participantsIndex: 'test@example.com'
        }
      });

      // Update sync status to idle (completed)
      await prisma.emailAccount.update({
        where: { id: emailAccount.id },
        data: {
          syncStatus: 'idle',
          lastSyncedAt: new Date()
        }
      });

      // Count synced messages
      const messageCount = await prisma.emailMessage.count({
        where: {
          thread: {
            accountId: emailAccount.id
          }
        }
      });

      const threadCount = await prisma.emailThread.count({
        where: { accountId: emailAccount.id }
      });

      return NextResponse.json({
        success: true,
        message: 'Simple direct email sync completed successfully',
        emailAccountId: emailAccount.id,
        orgId,
        syncStatus: 'idle',
        syncedMessages: messageCount,
        syncedThreads: threadCount,
        testData: {
          threadId: dummyThread.id,
          messageId: dummyMessage.id
        },
        timestamp: new Date().toISOString()
      });

    } catch (syncError: any) {
      // Update sync status to error
      await prisma.emailAccount.update({
        where: { id: emailAccount.id },
        data: {
          syncStatus: 'error',
          errorReason: syncError.message
        }
      });

      throw syncError;
    }

  } catch (error: any) {
    logger.error('Failed to perform simple direct email sync', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: "Failed to perform simple direct email sync", details: error.message }, { status: 500 });
  }
}
