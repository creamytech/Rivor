import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { GmailService } from '@/server/gmail';
import { GoogleCalendarService } from '@/server/calendar';
import { MicrosoftGraphService } from '@/server/microsoft-graph';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute timeout

interface SyncResult {
  email: {
    synced: boolean;
    newMessages?: number;
    newThreads?: number;
    error?: string;
  };
  calendar: {
    synced: boolean;
    newEvents?: number;
    error?: string;
  };
}

/**
 * Auto-sync endpoint that performs incremental sync for both email and calendar
 * This should be called periodically (e.g., every 5-15 minutes) by a cron job or client
 */
export async function POST(req: NextRequest) {
  const correlationId = `auto-sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
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

    logger.info('Auto-sync initiated', {
      correlationId,
      orgId,
      userEmail: session.user.email
    });

    const result: SyncResult = {
      email: { synced: false },
      calendar: { synced: false }
    };

    // 1. INCREMENTAL EMAIL SYNC
    try {
      const emailAccounts = await prisma.emailAccount.findMany({
        where: { 
          orgId, 
          status: 'connected',
          tokenStatus: 'encrypted' // Only sync accounts with valid tokens
        }
      });

      logger.info('Found email accounts for auto-sync', {
        correlationId,
        orgId,
        emailAccountCount: emailAccounts.length
      });

      if (emailAccounts.length > 0) {
        let totalNewMessages = 0;
        let totalNewThreads = 0;

        for (const emailAccount of emailAccounts) {
          try {
            // Check if we need to sync (only if no recent sync in last 10 minutes)
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            if (emailAccount.updatedAt && emailAccount.updatedAt > tenMinutesAgo) {
              logger.info('Skipping email sync - recently synced', {
                correlationId,
                emailAccountId: emailAccount.id,
                lastSync: emailAccount.updatedAt
              });
              continue;
            }

            let syncStats;
            if (emailAccount.provider === 'google') {
              const gmailService = await GmailService.createFromAccount(orgId, emailAccount.id);
              
              // Use historyId for incremental sync
              syncStats = await gmailService.syncMessages(
                orgId, 
                emailAccount.id, 
                emailAccount.historyId || undefined
              );
              
              // Update historyId from sync results
              if (syncStats?.historyId) {
                await prisma.emailAccount.update({
                  where: { id: emailAccount.id },
                  data: { 
                    historyId: syncStats.historyId,
                    lastSyncAt: new Date(),
                    updatedAt: new Date()
                  }
                });
              }

            } else if (emailAccount.provider === 'azure-ad') {
              const graphService = await MicrosoftGraphService.createFromAccount(orgId, emailAccount.id);
              
              // Use Delta queries for incremental sync
              syncStats = await graphService.syncMessages(
                orgId, 
                emailAccount.id, 
                emailAccount.historyId || undefined
              );
            }

            if (syncStats) {
              totalNewMessages += syncStats.newMessages || 0;
              totalNewThreads += syncStats.newThreads || 0;
            }

            logger.info('Email account auto-sync completed', {
              correlationId,
              emailAccountId: emailAccount.id,
              provider: emailAccount.provider,
              newMessages: syncStats?.newMessages || 0,
              newThreads: syncStats?.newThreads || 0
            });

          } catch (accountError) {
            logger.error('Email account auto-sync failed', {
              correlationId,
              emailAccountId: emailAccount.id,
              provider: emailAccount.provider,
              error: accountError instanceof Error ? accountError.message : String(accountError)
            });

            // Mark account as needing attention if sync fails
            await prisma.emailAccount.update({
              where: { id: emailAccount.id },
              data: { 
                status: 'action_needed',
                errorReason: accountError instanceof Error ? accountError.message : 'Sync failed'
              }
            }).catch(() => {}); // Ignore update errors
          }
        }

        result.email = {
          synced: true,
          newMessages: totalNewMessages,
          newThreads: totalNewThreads
        };
      } else {
        result.email = {
          synced: false,
          error: 'No connected email accounts found'
        };
      }
    } catch (emailError) {
      logger.error('Email auto-sync failed', {
        correlationId,
        orgId,
        error: emailError instanceof Error ? emailError.message : String(emailError)
      });
      
      result.email = {
        synced: false,
        error: emailError instanceof Error ? emailError.message : 'Email sync failed'
      };
    }

    // 2. INCREMENTAL CALENDAR SYNC
    try {
      const calendarAccounts = await prisma.calendarAccount.findMany({
        where: { 
          orgId, 
          status: 'connected'
        }
      });

      logger.info('Found calendar accounts for auto-sync', {
        correlationId,
        orgId,
        calendarAccountCount: calendarAccounts.length
      });

      if (calendarAccounts.length > 0) {
        let totalNewEvents = 0;

        for (const calendarAccount of calendarAccounts) {
          try {
            // Check if we need to sync (only if no recent sync in last 15 minutes)
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
            if (calendarAccount.updatedAt && calendarAccount.updatedAt > fifteenMinutesAgo) {
              logger.info('Skipping calendar sync - recently synced', {
                correlationId,
                calendarAccountId: calendarAccount.id,
                lastSync: calendarAccount.updatedAt
              });
              continue;
            }

            if (calendarAccount.provider === 'google') {
              const calendarService = await GoogleCalendarService.createFromAccount(orgId, calendarAccount.id);
              
              // Sync only recent events (7 days back, 30 days forward)
              const syncStats = await calendarService.syncEvents(orgId, calendarAccount.id, 7, 30);
              
              totalNewEvents += syncStats.newEvents || 0;

              // Update last sync time
              await prisma.calendarAccount.update({
                where: { id: calendarAccount.id },
                data: { 
                  lastSyncAt: new Date(),
                  updatedAt: new Date()
                }
              });

              logger.info('Calendar account auto-sync completed', {
                correlationId,
                calendarAccountId: calendarAccount.id,
                newEvents: syncStats.newEvents || 0
              });
            }

          } catch (accountError) {
            logger.error('Calendar account auto-sync failed', {
              correlationId,
              calendarAccountId: calendarAccount.id,
              provider: calendarAccount.provider,
              error: accountError instanceof Error ? accountError.message : String(accountError)
            });
          }
        }

        result.calendar = {
          synced: true,
          newEvents: totalNewEvents
        };
      } else {
        result.calendar = {
          synced: false,
          error: 'No connected calendar accounts found'
        };
      }
    } catch (calendarError) {
      logger.error('Calendar auto-sync failed', {
        correlationId,
        orgId,
        error: calendarError instanceof Error ? calendarError.message : String(calendarError)
      });
      
      result.calendar = {
        synced: false,
        error: calendarError instanceof Error ? calendarError.message : 'Calendar sync failed'
      };
    }

    logger.info('Auto-sync completed', {
      correlationId,
      orgId,
      result
    });

    return NextResponse.json({
      success: true,
      message: 'Auto-sync completed',
      correlationId,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Auto-sync failed', {
      correlationId,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Auto-sync failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      correlationId
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check auto-sync status
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ 
        error: 'No organization found' 
      }, { status: 400 });
    }

    // Get account sync statuses
    const [emailAccounts, calendarAccounts] = await Promise.all([
      prisma.emailAccount.findMany({
        where: { orgId },
        select: {
          id: true,
          provider: true,
          status: true,
          tokenStatus: true,
          lastSyncAt: true,
          updatedAt: true,
          historyId: true,
          errorReason: true
        }
      }),
      prisma.calendarAccount.findMany({
        where: { orgId },
        select: {
          id: true,
          provider: true,
          status: true,
          lastSyncAt: true,
          updatedAt: true
        }
      })
    ]);

    // Determine if auto-sync is working
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const emailSyncWorking = emailAccounts.some(acc => 
      acc.status === 'connected' && 
      acc.tokenStatus === 'encrypted' &&
      acc.updatedAt && acc.updatedAt > oneHourAgo
    );
    
    const calendarSyncWorking = calendarAccounts.some(acc => 
      acc.status === 'connected' && 
      acc.updatedAt && acc.updatedAt > oneHourAgo
    );

    return NextResponse.json({
      autoSyncEnabled: true,
      email: {
        working: emailSyncWorking,
        accounts: emailAccounts,
        lastSyncAny: emailAccounts.reduce((latest, acc) => {
          if (!acc.updatedAt) return latest;
          return !latest || acc.updatedAt > latest ? acc.updatedAt : latest;
        }, null as Date | null)
      },
      calendar: {
        working: calendarSyncWorking,
        accounts: calendarAccounts,
        lastSyncAny: calendarAccounts.reduce((latest, acc) => {
          if (!acc.updatedAt) return latest;
          return !latest || acc.updatedAt > latest ? acc.updatedAt : latest;
        }, null as Date | null)
      },
      overallHealth: emailSyncWorking && (calendarAccounts.length === 0 || calendarSyncWorking) ? 'healthy' : 'needs_attention'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get auto-sync status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}