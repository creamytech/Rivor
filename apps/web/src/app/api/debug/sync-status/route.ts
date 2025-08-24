import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { checkTokenHealth } from '@/server/oauth';
import { logger } from '@/lib/logger';
import { getEnv } from '@/server/env';

export const dynamic = 'force-dynamic';

/**
 * Comprehensive sync debugging endpoint
 * Tests all aspects of email and calendar sync
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const orgId = (session as { orgId?: string }).orgId;
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      user: {
        email: userEmail,
        orgId: orgId || 'NO_ORG_ID'
      },
      auth: {} as any,
      database: {} as any,
      googleApi: {} as any,
      sync: {} as any,
      webhooks: {} as any,
      errors: [] as string[]
    };

    // 1. Check Authentication & Tokens
    try {
      const tokenHealth = await checkTokenHealth(userEmail);
      debugInfo.auth = {
        tokenCount: tokenHealth.length,
        tokens: tokenHealth.map(t => ({
          provider: t.provider,
          connected: t.connected,
          expired: t.expired,
          expiresAt: t.expiresAt,
          scopes: t.scopes,
          error: t.error
        })),
        hasGmailScopes: tokenHealth.some(t => t.scopes.includes('https://www.googleapis.com/auth/gmail.readonly')),
        hasCalendarScopes: tokenHealth.some(t => t.scopes.includes('https://www.googleapis.com/auth/calendar')),
        validTokens: tokenHealth.filter(t => t.connected && !t.expired).length
      };
    } catch (error) {
      debugInfo.errors.push(`Auth check failed: ${error.message}`);
      debugInfo.auth.error = error.message;
    }

    // 2. Check Database Accounts
    if (orgId) {
      try {
        const emailAccounts = await prisma.emailAccount.findMany({
          where: { orgId },
          include: {
            _count: {
              select: {
                emailThreads: true
              }
            }
          }
        });

        const calendarAccounts = await prisma.calendarAccount.findMany({
          where: { orgId },
          include: {
            _count: {
              select: {
                calendarEvents: true
              }
            }
          }
        });

        debugInfo.database = {
          emailAccounts: emailAccounts.map(acc => ({
            id: acc.id,
            email: acc.email,
            provider: acc.provider,
            status: acc.status,
            syncStatus: acc.syncStatus,
            encryptionStatus: acc.encryptionStatus,
            lastSyncedAt: acc.lastSyncedAt,
            threadCount: acc._count.emailThreads,
            hasTokenRef: !!acc.tokenRef,
            externalAccountId: acc.externalAccountId
          })),
          calendarAccounts: calendarAccounts.map(acc => ({
            id: acc.id,
            provider: acc.provider,
            status: acc.status,
            lastSyncedAt: acc.lastSyncedAt,
            eventCount: acc._count.calendarEvents
          }))
        };
      } catch (error) {
        debugInfo.errors.push(`Database check failed: ${error.message}`);
        debugInfo.database.error = error.message;
      }
    }

    // 3. Check Google API Configuration
    try {
      const env = getEnv();
      debugInfo.googleApi = {
        clientIdSet: !!env.GOOGLE_CLIENT_ID,
        clientSecretSet: !!env.GOOGLE_CLIENT_SECRET,
        projectIdSet: !!env.GOOGLE_PROJECT_ID,
        pubsubConfigured: !!(env.GOOGLE_PUBSUB_TOPIC && env.GOOGLE_PUBSUB_VERIFICATION_TOKEN),
        pubsubTopic: env.GOOGLE_PUBSUB_TOPIC || null,
        scopesConfigured: env.GOOGLE_OAUTH_SCOPES || null,
        redirectUri: env.NEXTAUTH_URL ? `${env.NEXTAUTH_URL}/api/auth/callback/google` : 'NOT_SET'
      };
    } catch (error) {
      debugInfo.errors.push(`Google API config check failed: ${error.message}`);
      debugInfo.googleApi.error = error.message;
    }

    // 4. Check Sync Status
    if (orgId) {
      try {
        // Recent sync logs from audit table
        const recentSyncLogs = await prisma.auditLog.findMany({
          where: {
            orgId,
            action: {
              in: ['gmail_sync', 'calendar_sync', 'gmail_push_received', 'calendar_push_received']
            },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            action: true,
            success: true,
            createdAt: true,
            resource: true
          }
        });

        // Check for recent push notifications
        const recentPushes = await prisma.pushNotificationLog.findMany({
          where: {
            orgId,
            processedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { processedAt: 'desc' },
          take: 5
        });

        debugInfo.sync = {
          recentSyncLogs: recentSyncLogs,
          recentPushNotifications: recentPushes.length,
          lastPushReceived: recentPushes[0]?.processedAt || null
        };
      } catch (error) {
        debugInfo.errors.push(`Sync status check failed: ${error.message}`);
        debugInfo.sync.error = error.message;
      }
    }

    // 5. Test Manual Sync (if requested)
    const testSync = req.nextUrl.searchParams.get('testSync') === 'true';
    if (testSync && orgId) {
      try {
        // Try to trigger Gmail sync
        const emailAccount = await prisma.emailAccount.findFirst({
          where: { orgId, provider: 'google', status: 'connected' }
        });

        if (emailAccount) {
          const { GmailService } = await import('@/server/gmail');
          const gmailService = await GmailService.createFromAccount(orgId, emailAccount.id);
          await gmailService.syncMessages(orgId, emailAccount.id);
          debugInfo.sync.gmailTestSync = 'SUCCESS';
        } else {
          debugInfo.sync.gmailTestSync = 'NO_CONNECTED_ACCOUNT';
        }

        // Try to trigger Calendar sync
        const calendarAccount = await prisma.calendarAccount.findFirst({
          where: { orgId, provider: 'google' }
        });

        if (calendarAccount) {
          const { GoogleCalendarService } = await import('@/server/calendar');
          const calendarService = await GoogleCalendarService.createFromAccount(orgId, calendarAccount.id);
          await calendarService.syncEvents(orgId, calendarAccount.id, 30, 90);
          debugInfo.sync.calendarTestSync = 'SUCCESS';
        } else {
          debugInfo.sync.calendarTestSync = 'NO_CALENDAR_ACCOUNT';
        }
      } catch (error) {
        debugInfo.errors.push(`Test sync failed: ${error.message}`);
        debugInfo.sync.testSyncError = error.message;
      }
    }

    debugInfo.responseTimeMs = Date.now() - startTime;
    debugInfo.status = debugInfo.errors.length > 0 ? 'ISSUES_FOUND' : 'OK';

    return NextResponse.json(debugInfo);

  } catch (error) {
    logger.error('Sync debug API failed', { error: error.message });
    
    return NextResponse.json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTimeMs: Date.now() - startTime
    }, { status: 500 });
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

    const { action } = await req.json();

    switch (action) {
      case 'force_gmail_sync':
        try {
          const response = await fetch(`${req.nextUrl.origin}/api/sync/gmail`, {
            method: 'POST',
            headers: {
              'Cookie': req.headers.get('Cookie') || ''
            }
          });
          const result = await response.json();
          return NextResponse.json({ action: 'force_gmail_sync', result, success: response.ok });
        } catch (error) {
          return NextResponse.json({ action: 'force_gmail_sync', error: error.message, success: false });
        }

      case 'force_calendar_sync':
        try {
          const response = await fetch(`${req.nextUrl.origin}/api/sync/calendar`, {
            method: 'POST',
            headers: {
              'Cookie': req.headers.get('Cookie') || ''
            }
          });
          const result = await response.json();
          return NextResponse.json({ action: 'force_calendar_sync', result, success: response.ok });
        } catch (error) {
          return NextResponse.json({ action: 'force_calendar_sync', error: error.message, success: false });
        }

      case 'reset_sync_status':
        try {
          await prisma.emailAccount.updateMany({
            where: { orgId },
            data: { syncStatus: 'idle', lastSyncedAt: null }
          });
          
          await prisma.calendarAccount.updateMany({
            where: { orgId },
            data: { lastSyncedAt: null }
          });

          return NextResponse.json({ action: 'reset_sync_status', success: true });
        } catch (error) {
          return NextResponse.json({ action: 'reset_sync_status', error: error.message, success: false });
        }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}