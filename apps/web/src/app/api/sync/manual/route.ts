import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { GmailService } from '@/server/gmail';
import { GoogleCalendarService } from '@/server/calendar';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minute timeout for manual sync

/**
 * Manual sync endpoint - forces immediate sync of email and calendar
 * This can be used to test token refresh and sync functionality
 */
export async function POST(req: NextRequest) {
  const correlationId = `manual-sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ 
        error: 'No organization found - please complete onboarding first' 
      }, { status: 400 });
    }

    const { force } = await req.json().catch(() => ({ force: false }));

    logger.info('Manual sync initiated', {
      correlationId,
      orgId,
      userEmail: session.user.email,
      force
    });

    const results = {
      email: { accounts: [], errors: [] },
      calendar: { accounts: [], errors: [] },
      summary: { totalNewMessages: 0, totalNewThreads: 0, totalNewEvents: 0 }
    };

    // 1. FORCE EMAIL SYNC
    try {
      const emailAccounts = await prisma.emailAccount.findMany({
        where: { orgId },
        include: { user: { include: { accounts: true } } }
      });

      logger.info('Found email accounts for manual sync', {
        correlationId,
        emailAccountCount: emailAccounts.length
      });

      for (const emailAccount of emailAccounts) {
        try {
          if (emailAccount.provider === 'google') {
            const gmailService = await GmailService.createFromAccount(orgId, emailAccount.id);
            
            // Force full sync or incremental based on request
            const syncStats = await gmailService.syncMessages(
              orgId, 
              emailAccount.id, 
              force ? undefined : emailAccount.historyId || undefined
            );
            
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
            }

            results.email.accounts.push({
              id: emailAccount.id,
              email: emailAccount.email,
              provider: emailAccount.provider,
              success: true,
              newMessages: syncStats?.newMessages || 0,
              newThreads: syncStats?.newThreads || 0,
              totalThreads: syncStats?.totalThreads || 0
            });

            results.summary.totalNewMessages += syncStats?.newMessages || 0;
            results.summary.totalNewThreads += syncStats?.newThreads || 0;

            logger.info('Email account manual sync completed', {
              correlationId,
              emailAccountId: emailAccount.id,
              provider: emailAccount.provider,
              newMessages: syncStats?.newMessages || 0,
              newThreads: syncStats?.newThreads || 0
            });

          } else {
            results.email.accounts.push({
              id: emailAccount.id,
              email: emailAccount.email,
              provider: emailAccount.provider,
              success: false,
              error: `Provider ${emailAccount.provider} not supported yet`
            });
          }

        } catch (accountError) {
          logger.error('Email account manual sync failed', {
            correlationId,
            emailAccountId: emailAccount.id,
            provider: emailAccount.provider,
            error: accountError instanceof Error ? accountError.message : String(accountError)
          });

          results.email.accounts.push({
            id: emailAccount.id,
            email: emailAccount.email,
            provider: emailAccount.provider,
            success: false,
            error: accountError instanceof Error ? accountError.message : String(accountError)
          });

          results.email.errors.push({
            accountId: emailAccount.id,
            error: accountError instanceof Error ? accountError.message : String(accountError)
          });

          // Mark account as needing attention
          await prisma.emailAccount.update({
            where: { id: emailAccount.id },
            data: { 
              status: 'action_needed',
              syncStatus: 'error',
              errorReason: accountError instanceof Error ? accountError.message : 'Sync failed'
            }
          }).catch(() => {}); // Ignore update errors
        }
      }

    } catch (emailError) {
      logger.error('Email manual sync failed', {
        correlationId,
        orgId,
        error: emailError instanceof Error ? emailError.message : String(emailError)
      });
      
      results.email.errors.push({
        error: emailError instanceof Error ? emailError.message : 'Email sync failed'
      });
    }

    // 2. FORCE CALENDAR SYNC
    try {
      const calendarAccounts = await prisma.calendarAccount.findMany({
        where: { orgId }
      });

      logger.info('Found calendar accounts for manual sync', {
        correlationId,
        calendarAccountCount: calendarAccounts.length
      });

      for (const calendarAccount of calendarAccounts) {
        try {
          if (calendarAccount.provider === 'google') {
            const calendarService = await GoogleCalendarService.createFromAccount(orgId, calendarAccount.id);
            
            // Sync events (30 days back, 90 days forward for manual sync)
            const syncStats = await calendarService.syncEvents(orgId, calendarAccount.id, 30, 90);
            
            results.calendar.accounts.push({
              id: calendarAccount.id,
              provider: calendarAccount.provider,
              success: true,
              newEvents: syncStats.newEvents || 0
            });

            results.summary.totalNewEvents += syncStats.newEvents || 0;

            // Update last sync time
            await prisma.calendarAccount.update({
              where: { id: calendarAccount.id },
              data: { 
                updatedAt: new Date(),
                status: 'connected'
              }
            });

            logger.info('Calendar account manual sync completed', {
              correlationId,
              calendarAccountId: calendarAccount.id,
              newEvents: syncStats.newEvents || 0
            });

          } else {
            results.calendar.accounts.push({
              id: calendarAccount.id,
              provider: calendarAccount.provider,
              success: false,
              error: `Provider ${calendarAccount.provider} not supported yet`
            });
          }

        } catch (accountError) {
          logger.error('Calendar account manual sync failed', {
            correlationId,
            calendarAccountId: calendarAccount.id,
            provider: calendarAccount.provider,
            error: accountError instanceof Error ? accountError.message : String(accountError)
          });

          results.calendar.accounts.push({
            id: calendarAccount.id,
            provider: calendarAccount.provider,
            success: false,
            error: accountError instanceof Error ? accountError.message : String(accountError)
          });

          results.calendar.errors.push({
            accountId: calendarAccount.id,
            error: accountError instanceof Error ? accountError.message : String(accountError)
          });
        }
      }

    } catch (calendarError) {
      logger.error('Calendar manual sync failed', {
        correlationId,
        orgId,
        error: calendarError instanceof Error ? calendarError.message : String(calendarError)
      });
      
      results.calendar.errors.push({
        error: calendarError instanceof Error ? calendarError.message : 'Calendar sync failed'
      });
    }

    logger.info('Manual sync completed', {
      correlationId,
      orgId,
      summary: results.summary
    });

    return NextResponse.json({
      success: true,
      message: 'Manual sync completed',
      correlationId,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Manual sync failed', {
      correlationId,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Manual sync failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      correlationId
    }, { status: 500 });
  }
}