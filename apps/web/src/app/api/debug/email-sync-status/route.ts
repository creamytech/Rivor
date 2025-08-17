import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { enqueueEmailBackfill } from '@/server/queue';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const userEmail = session.user.email;

    // Check email accounts
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        provider: true,
        email: true,
        status: true,
        syncStatus: true,
        lastSyncedAt: true,
        errorReason: true,
        createdAt: true
      }
    });

    // Check email data
    const threadCount = await prisma.emailThread.count({ where: { orgId } });
    const messageCount = await prisma.emailMessage.count({ where: { orgId } });

    // Check recent threads
    const recentThreads = await prisma.emailThread.findMany({
      where: { orgId },
      select: {
        id: true,
        subjectEnc: true,
        participantsEnc: true,
        updatedAt: true,
        _count: { select: { messages: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    // Check a few recent messages to see the data format
    const recentMessages = await prisma.emailMessage.findMany({
      where: { orgId },
      select: {
        id: true,
        threadId: true,
        sentAt: true
      },
      orderBy: { sentAt: 'desc' },
      take: 3
    });

    return NextResponse.json({
      success: true,
      status: {
        orgId,
        userEmail,
        emailAccounts: emailAccounts.length,
        connectedAccounts: emailAccounts.filter(a => a.status === 'connected').length,
        threadCount,
        messageCount,
        hasData: threadCount > 0 || messageCount > 0,
        accounts: emailAccounts,
        recentThreads: recentThreads.map(t => ({
          id: t.id,
          subject: t.subjectEnc ? 'Encrypted Subject' : 'No Subject',
          participants: t.participantsEnc ? 'Encrypted Participants' : 'No Participants',
          subjectEnc: t.subjectEnc ? 'Encrypted' : 'Not Encrypted',
          participantsEnc: t.participantsEnc ? 'Encrypted' : 'Not Encrypted',
          messageCount: t._count.messages,
          updatedAt: t.updatedAt
        })),
        recentMessages: recentMessages.map(m => ({
          id: m.id,
          threadId: m.threadId,
          sentAt: m.sentAt
        }))
      }
    });

  } catch (error) {
    logger.error('Email sync status check failed:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to check email sync status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

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

    // Get connected email accounts
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId, status: 'connected' }
    });

    if (emailAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No connected email accounts found. Please connect an email account first.'
      }, { status: 400 });
    }

    // Trigger sync for each account
    const syncJobs = [];
    for (const account of emailAccounts) {
      try {
        await enqueueEmailBackfill(orgId, account.id, 30); // Sync last 30 days
        syncJobs.push({
          accountId: account.id,
          email: account.email,
          provider: account.provider,
          status: 'queued'
        });
      } catch (error) {
        syncJobs.push({
          accountId: account.id,
          email: account.email,
          provider: account.provider,
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
    logger.error('Failed to trigger email sync:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to trigger email sync', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
