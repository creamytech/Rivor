import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
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
      where: { orgId, status: 'connected' }
    });

    if (emailAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No connected email accounts found'
      }, { status: 400 });
    }

    // Update sync status to idle (bypass queue)
    const updatedAccounts = [];
    for (const account of emailAccounts) {
      const updatedAccount = await prisma.emailAccount.update({
        where: { id: account.id },
        data: {
          syncStatus: 'idle',
          lastSyncedAt: new Date(),
          errorReason: null
        }
      });
      updatedAccounts.push(updatedAccount);
    }

    logger.info('Manual sync status update', {
      orgId,
      accountsCount: updatedAccounts.length,
      action: 'manual_sync_status_update'
    });

    return NextResponse.json({
      success: true,
      message: `Updated sync status for ${updatedAccounts.length} account(s)`,
      accounts: updatedAccounts.map(acc => ({
        id: acc.id,
        email: acc.email,
        syncStatus: acc.syncStatus,
        lastSyncedAt: acc.lastSyncedAt
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Force sync status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update sync status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
