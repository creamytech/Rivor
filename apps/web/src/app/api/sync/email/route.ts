import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { enqueueEmailSync } from '@/server/queue';

// Force dynamic rendering - this route uses session/auth data
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const orgId = (session as any).orgId as string | undefined;
    if (!orgId) {
      return new Response('Forbidden', { status: 403 });
    }

    // Find email accounts for this org
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId },
    });

    if (emailAccounts.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'No email accounts configured. Please sign in again to set up email sync.',
        accounts: []
      });
    }

    // Trigger sync for all accounts
    const syncResults = [];
    for (const account of emailAccounts) {
      try {
        await enqueueEmailSync(orgId, account.id);
        syncResults.push({
          accountId: account.id,
          provider: account.provider,
          status: 'queued'
        });
      } catch (error) {
        syncResults.push({
          accountId: account.id,
          provider: account.provider,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return Response.json({
      success: true,
      message: `Email sync queued for ${emailAccounts.length} account(s)`,
      accounts: syncResults
    });

  } catch (error) {
    console.error('Email sync trigger error:', error);
    return Response.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to trigger email sync'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const orgId = (session as any).orgId as string | undefined;
    if (!orgId) {
      return new Response('Forbidden', { status: 403 });
    }

    // Check sync status
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId },
    });

    const threadCount = await prisma.emailThread.count({
      where: { orgId }
    });

    const messageCount = await prisma.emailMessage.count({
      where: { orgId }
    });

    return Response.json({
      accounts: emailAccounts.map(account => ({
        id: account.id,
        provider: account.provider,
        status: account.status,
        updatedAt: account.updatedAt
      })),
      data: {
        threadCount,
        messageCount
      }
    });

  } catch (error) {
    console.error('Email sync status error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Failed to get sync status'
    }, { status: 500 });
  }
}
