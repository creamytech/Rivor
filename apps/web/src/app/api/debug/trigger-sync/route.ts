import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { enqueueEmailBackfill } from '@/server/queue';
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

    // Get all email accounts (not just connected ones)
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId }
    });

    if (emailAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No email accounts found'
      }, { status: 400 });
    }

    // Queue sync for each account
    const syncJobs = [];
    for (const account of emailAccounts) {
      try {
        logger.info('Triggering sync for account', {
          accountId: account.id,
          emailAddress: account.email
        });
        await enqueueEmailBackfill(orgId, account.id, 30); // Sync last 30 days
        syncJobs.push({
          accountId: account.id,
          email: account.email,
          provider: account.provider,
          status: account.status,
          syncStatus: account.syncStatus,
          status: 'queued'
        });
      } catch (error) {
        syncJobs.push({
          accountId: account.id,
          email: account.email,
          provider: account.provider,
          status: account.status,
          syncStatus: account.syncStatus,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Manual email sync triggered', {
      orgId,
      accountsCount: emailAccounts.length,
      syncJobs
    });

    return NextResponse.json({
      success: true,
      message: `Email sync queued for ${emailAccounts.length} account(s)`,
      accounts: syncJobs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to trigger email sync:', error);
    return NextResponse.json(
      { error: 'Failed to trigger email sync', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
