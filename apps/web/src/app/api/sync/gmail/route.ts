import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { GmailService } from '@/server/gmail';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

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

    // Get the user's Gmail account
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        orgId,
        provider: 'google',
        status: 'connected'
      }
    });

    if (!emailAccount) {
      return NextResponse.json({ 
        error: 'No connected Gmail account found',
        action: 'connect_gmail'
      }, { status: 404 });
    }

    logger.info('Manual Gmail sync initiated', {
      orgId,
      emailAccountId: emailAccount.id,
      userEmail: session.user.email,
      action: 'manual_gmail_sync_start'
    });

    // Create Gmail service instance
    const gmailService = await GmailService.createFromAccount(orgId, emailAccount.id);

    // Perform sync
    await gmailService.syncMessages(orgId, emailAccount.id);

    // Update last sync time
    await prisma.emailAccount.update({
      where: { id: emailAccount.id },
      data: { 
        lastSyncedAt: new Date(),
        status: 'connected'
      }
    });

    logger.info('Manual Gmail sync completed', {
      orgId,
      emailAccountId: emailAccount.id,
      userEmail: session.user.email,
      action: 'manual_gmail_sync_complete'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Gmail sync completed successfully',
      lastSyncedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Manual Gmail sync failed', {
      error: error instanceof Error ? error.message : String(error),
      action: 'manual_gmail_sync_failed'
    });

    // Check if it's an authentication error
    if (error && typeof error === 'object' && 'code' in error && error.code === 401) {
      return NextResponse.json({ 
        error: 'Authentication failed - please reconnect your Gmail account',
        action: 'reauthenticate_gmail'
      }, { status: 401 });
    }

    return NextResponse.json({ 
      error: 'Gmail sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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

    // Get sync status
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        orgId,
        provider: 'google'
      },
      select: {
        id: true,
        status: true,
        lastSyncedAt: true,
        email: true
      }
    });

    if (!emailAccount) {
      return NextResponse.json({
        connected: false,
        message: 'No Gmail account connected'
      });
    }

    return NextResponse.json({
      connected: emailAccount.status === 'connected',
      status: emailAccount.status,
      lastSyncedAt: emailAccount.lastSyncedAt?.toISOString(),
      email: emailAccount.email
    });

  } catch (error) {
    logger.error('Failed to get Gmail sync status', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({ 
      error: 'Failed to get sync status' 
    }, { status: 500 });
  }
}