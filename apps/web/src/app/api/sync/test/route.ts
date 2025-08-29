import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-pool';
import { GmailService } from '@/server/gmail';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * Test sync endpoint for debugging (development only)
 * This bypasses authentication and tests sync directly
 */
export async function POST(req: NextRequest) {
  const correlationId = `test-sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
    }

    logger.info('Test sync initiated', { correlationId });

    // Get the first email account for testing
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        status: { in: ['connected', 'action_needed'] },
        provider: 'google'
      },
      include: {
        org: true
      }
    });

    if (!emailAccount) {
      return NextResponse.json({
        success: false,
        error: 'No Google email account found for testing'
      });
    }

    logger.info('Found test email account', {
      correlationId,
      accountId: emailAccount.id,
      email: emailAccount.email,
      orgId: emailAccount.orgId,
      hasHistoryId: !!emailAccount.historyId,
      lastSyncedAt: emailAccount.lastSyncedAt
    });

    try {
      // Create Gmail service
      const gmailService = await GmailService.createFromAccount(emailAccount.orgId, emailAccount.id);
      
      // Test sync with current historyId (incremental) or full sync if no historyId
      logger.info('Starting Gmail sync test', {
        correlationId,
        accountId: emailAccount.id,
        historyId: emailAccount.historyId || 'none'
      });

      const syncStats = await gmailService.syncMessages(
        emailAccount.orgId, 
        emailAccount.id, 
        emailAccount.historyId || undefined
      );
      
      logger.info('Gmail sync test completed', {
        correlationId,
        accountId: emailAccount.id,
        syncStats
      });

      // Update account with sync results
      if (syncStats?.historyId) {
        await prisma.emailAccount.update({
          where: { id: emailAccount.id },
          data: { 
            historyId: syncStats.historyId,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
            status: 'connected',
            syncStatus: 'ready',
            tokenStatus: 'encrypted',
            errorReason: null
          }
        });
        
        logger.info('Updated email account after sync', {
          correlationId,
          accountId: emailAccount.id,
          newHistoryId: syncStats.historyId
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Test sync completed successfully',
        correlationId,
        account: {
          id: emailAccount.id,
          email: emailAccount.email,
          orgId: emailAccount.orgId
        },
        results: {
          newMessages: syncStats?.newMessages || 0,
          newThreads: syncStats?.newThreads || 0,
          totalThreads: syncStats?.totalThreads || 0,
          historyId: syncStats?.historyId || 'none',
          previousHistoryId: emailAccount.historyId || 'none'
        },
        timestamp: new Date().toISOString()
      });

    } catch (syncError) {
      logger.error('Gmail sync test failed', {
        correlationId,
        accountId: emailAccount.id,
        error: syncError instanceof Error ? syncError.message : String(syncError)
      });

      return NextResponse.json({
        success: false,
        error: 'Gmail sync test failed',
        details: syncError instanceof Error ? syncError.message : String(syncError),
        correlationId,
        account: {
          id: emailAccount.id,
          email: emailAccount.email,
          orgId: emailAccount.orgId
        }
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('Test sync failed', {
      correlationId,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Test sync failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      correlationId
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check test sync availability
 */
export async function GET() {
  return NextResponse.json({
    available: process.env.NODE_ENV === 'development',
    message: process.env.NODE_ENV === 'development'
      ? 'Test sync is available. Use POST to run a test sync.'
      : 'Test sync only available in development',
    usage: 'POST /api/sync/test'
  });
}