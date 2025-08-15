import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { GmailService } from '@/server/gmail';
import { MicrosoftGraphService } from '@/server/microsoft-graph';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Manual email sync API route for Vercel deployment
 * This replaces the background worker for serverless environments
 */
export async function POST(_req: NextRequest) {
  const correlationId = `manual-sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Get authenticated user session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId || orgId === 'default') {
      return NextResponse.json({ 
        error: 'Authentication setup incomplete. Please sign out and sign in again with Google to complete setup.',
        details: 'Organization not properly created during sign-in process.',
        action: 'Please go to Settings and reconnect your Google account.'
      }, { status: 401 });
    }

    logger.info('Manual email sync triggered', {
      correlationId,
      orgId,
      action: 'manual_sync_triggered'
    });

    // Find all email accounts for this org
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId, status: 'connected' }
    });

    if (emailAccounts.length === 0) {
      logger.warn('No connected email accounts found', {
        correlationId,
        orgId,
        action: 'no_accounts_found'
      });
      
      return NextResponse.json({ 
        error: 'No connected email accounts found. Please sign in with Google or Microsoft first.',
        accountsFound: 0 
      }, { status: 404 });
    }

    const results = [];

    // Process each email account
    for (const emailAccount of emailAccounts) {
      try {
        logger.info('Processing email account', {
          correlationId,
          emailAccountId: emailAccount.id,
          provider: emailAccount.provider,
          action: 'processing_account'
        });

        let syncResult;

        if (emailAccount.provider === 'google') {
          const gmailService = await GmailService.createFromAccount(orgId, emailAccount.id);
          await gmailService.syncMessages(orgId, emailAccount.id, emailAccount.historyId || undefined);
          
          // Set up push notifications if not already done
          if (!emailAccount.historyId) {
            await gmailService.watchMailbox(orgId, emailAccount.id);
          }
          
          syncResult = { provider: 'google', status: 'success' };
          
        } else if (emailAccount.provider === 'azure-ad') {
          const graphService = await MicrosoftGraphService.createFromAccount(orgId, emailAccount.id);
          await graphService.syncMessages(orgId, emailAccount.id, emailAccount.historyId || undefined);
          
          // Set up webhook if not already done
          if (!emailAccount.historyId) {
            await graphService.createSubscription(orgId, emailAccount.id);
          }
          
          // Also sync calendar events
          await graphService.syncCalendar(orgId, emailAccount.id);
          
          syncResult = { provider: 'microsoft', status: 'success' };
        } else {
          syncResult = { provider: emailAccount.provider, status: 'unsupported' };
        }

        // Update account status
        await prisma.emailAccount.update({
          where: { id: emailAccount.id },
          data: { 
            status: 'connected',
            updatedAt: new Date()
          }
        });

        results.push({
          accountId: emailAccount.id,
          ...syncResult
        });

        logger.info('Email account sync completed', {
          correlationId,
          emailAccountId: emailAccount.id,
          provider: emailAccount.provider,
          action: 'account_sync_completed'
        });

      } catch (error: unknown) {
        logger.error('Email account sync failed', {
          correlationId,
          emailAccountId: emailAccount.id,
          provider: emailAccount.provider,
          error: error.message,
          action: 'account_sync_failed'
        });

        // Update account status on error
        await prisma.emailAccount.update({
          where: { id: emailAccount.id },
          data: { 
            status: 'action_needed',
            updatedAt: new Date()
          }
        }).catch(() => {}); // Ignore update errors

        results.push({
          accountId: emailAccount.id,
          provider: emailAccount.provider,
          status: 'error',
          error: error.message
        });
      }
    }

    logger.info('Manual email sync completed', {
      correlationId,
      orgId,
      totalAccounts: emailAccounts.length,
      results,
      action: 'manual_sync_completed'
    });

    return NextResponse.json({ 
      success: true,
      message: `Synced ${emailAccounts.length} email account(s)`,
      accountsProcessed: emailAccounts.length,
      results,
      correlationId
    });

  } catch (error: unknown) {
    logger.error('Manual email sync failed', {
      correlationId,
      error: error.message,
      action: 'manual_sync_failed'
    });

    return NextResponse.json({ 
      error: 'Email sync failed', 
      details: error.message,
      correlationId 
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check sync status
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId || orgId === 'default') {
      return NextResponse.json({ 
        error: 'Authentication setup incomplete. Please sign out and sign in again with Google to complete setup.',
        details: 'Organization not properly created during sign-in process.'
      }, { status: 401 });
    }

    // Get email account statuses
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        provider: true,
        status: true,
        updatedAt: true,
        historyId: true
      }
    });

    // Get recent email threads count
    const threadsCount = await prisma.emailThread.count({
      where: { orgId }
    });

    // Get recent messages count
    const messagesCount = await prisma.emailMessage.count({
      where: { orgId }
    });

    return NextResponse.json({
      emailAccounts,
      threadsCount,
      messagesCount,
      lastCheck: new Date().toISOString()
    });

  } catch (error: unknown) {
    return NextResponse.json({ 
      error: 'Failed to check sync status', 
      details: error.message 
    }, { status: 500 });
  }
}