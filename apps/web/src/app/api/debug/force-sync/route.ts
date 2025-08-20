import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { GmailService } from '@/server/gmail';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get email accounts
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId }
    });

    if (emailAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No email accounts found'
      }, { status: 400 });
    }

    const results = [];

    for (const account of emailAccounts) {
      try {
        logger.info('Starting forced sync for account', { 
          accountId: account.id, 
          email: account.email,
          orgId 
        });

        // Update status to running
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: { 
            syncStatus: 'running',
            updatedAt: new Date()
          }
        });

        // Create Gmail service and sync
        const gmailService = await GmailService.createFromAccount(orgId, account.id);
        
        // Force sync last 30 days of messages
        await gmailService.syncMessages(orgId, account.id, account.historyId || undefined);

        // Update status to completed
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: { 
            syncStatus: 'idle',
            lastSyncedAt: new Date(),
            updatedAt: new Date()
          }
        });

        results.push({
          accountId: account.id,
          email: account.email,
          status: 'success',
          message: 'Sync completed successfully'
        });

        logger.info('Forced sync completed for account', { 
          accountId: account.id, 
          email: account.email 
        });

      } catch (error) {
        logger.error('Forced sync failed for account', { 
          accountId: account.id, 
          email: account.email,
          error: error instanceof Error ? error.message : String(error)
        });

        // Update status to error
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: { 
            syncStatus: 'error',
            errorReason: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date()
          }
        });

        results.push({
          accountId: account.id,
          email: account.email,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Forced sync completed for ${emailAccounts.length} account(s)`,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Forced sync failed:', error);
    return NextResponse.json(
      { error: 'Failed to force sync', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
