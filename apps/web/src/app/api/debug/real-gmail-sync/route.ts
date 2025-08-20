import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { GmailService } from '@/server/gmail';
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

    // Check if SecureToken exists
    const secureToken = await prisma.secureToken.findFirst({
      where: { 
        orgId,
        provider: 'google',
        tokenType: 'oauth_access'
      }
    });

    if (!secureToken) {
      return NextResponse.json({ error: "SecureToken not found" }, { status: 404 });
    }

    logger.info('Starting real Gmail sync', {
      userEmail,
      orgId,
      emailAccountId: emailAccount.id,
      secureTokenId: secureToken.id
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
      // Create Gmail service and sync real emails
      const gmailService = await GmailService.createFromAccount(orgId, emailAccount.id);
      
      // Sync recent messages (last 30 days for testing)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      logger.info('Starting Gmail backfill', {
        orgId,
        emailAccountId: emailAccount.id,
        cutoffDate: cutoffDate.toISOString()
      });

      await gmailService.performInitialBackfill(orgId, emailAccount.id, cutoffDate);

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
        message: 'Real Gmail sync completed successfully',
        emailAccountId: emailAccount.id,
        orgId,
        syncStatus: 'idle',
        syncedMessages: messageCount,
        syncedThreads: threadCount,
        cutoffDate: cutoffDate.toISOString(),
        timestamp: new Date().toISOString()
      });

    } catch (syncError: any) {
      logger.error('Real Gmail sync failed', {
        orgId,
        emailAccountId: emailAccount.id,
        error: syncError.message,
        stack: syncError.stack
      });

      // Update sync status to error
      await prisma.emailAccount.update({
        where: { id: emailAccount.id },
        data: { 
          syncStatus: 'error',
          errorReason: syncError.message
        }
      });

      return NextResponse.json({
        error: "Real Gmail sync failed",
        details: syncError.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error: any) {
    logger.error('Failed to perform real Gmail sync', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: "Failed to perform real Gmail sync", details: error.message }, { status: 500 });
  }
}
