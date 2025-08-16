import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(__request: NextRequest) {
  const steps = [];
  
  try {
    steps.push('1. Starting sync debug endpoint');
    
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const orgId = (session as { orgId?: string }).orgId;

    if (!orgId || orgId === 'unknown') {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    steps.push('2. Authentication successful');

    // Get user to find correct userId
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    steps.push('3. User found');

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

    steps.push('4. EmailAccount found');

    logger.info('Starting detailed sync debug', {
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

    steps.push('5. Sync status updated to running');

    try {
      // Step 1: Create thread
      steps.push('6. Creating email thread...');
      
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

      steps.push('7. Email thread created successfully');

      // Step 2: Create message
      steps.push('8. Creating email message...');
      
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

      steps.push('9. Email message created successfully');

      // Update sync status to idle (completed)
      await prisma.emailAccount.update({
        where: { id: emailAccount.id },
        data: {
          syncStatus: 'idle',
          lastSyncedAt: new Date()
        }
      });

      steps.push('10. Sync status updated to idle');

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

      steps.push('11. Counts retrieved successfully');

      return NextResponse.json({
        success: true,
        message: 'Detailed sync debug completed successfully',
        emailAccountId: emailAccount.id,
        orgId,
        syncStatus: 'idle',
        syncedMessages: messageCount,
        syncedThreads: threadCount,
        testData: {
          threadId: dummyThread.id,
          messageId: dummyMessage.id
        },
        steps: steps,
        timestamp: new Date().toISOString()
      });

    } catch (syncError: any) {
      steps.push(`ERROR: ${syncError.message}`);
      
      // Update sync status to error
      await prisma.emailAccount.update({
        where: { id: emailAccount.id },
        data: {
          syncStatus: 'error',
          errorReason: syncError.message
        }
      });

      return NextResponse.json({
        error: "Sync failed during execution",
        details: syncError.message,
        steps: steps,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error: any) {
    steps.push(`FATAL ERROR: ${error.message}`);
    
    logger.error('Failed to perform detailed sync debug', { 
      error: error.message, 
      stack: error.stack,
      steps: steps 
    });
    
    return NextResponse.json({ 
      error: "Failed to perform detailed sync debug", 
      details: error.message,
      steps: steps,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
