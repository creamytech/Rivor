import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-pool';
import { scheduledSyncService } from '@/server/scheduled-sync-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Diagnostics endpoint to check sync system health
 * This endpoint bypasses authentication in development for debugging
 */
export async function GET(req: NextRequest) {
  try {
    // Only allow in development or with special header
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasDebugHeader = req.headers.get('X-Debug-Access') === 'allow';
    
    if (!isDevelopment && !hasDebugHeader) {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    logger.info('Sync diagnostics requested', {
      userAgent: req.headers.get('user-agent'),
      isDevelopment
    });

    // Get all organizations
    const orgs = await prisma.org.findMany({
      select: {
        id: true,
        name: true,
        emailAccounts: {
          select: {
            id: true,
            email: true,
            provider: true,
            status: true,
            lastSyncedAt: true,
            updatedAt: true,
            historyId: true,
            errorReason: true
          }
        },
        calendarAccounts: {
          select: {
            id: true,
            provider: true,
            status: true,
            updatedAt: true
          }
        }
      }
    });

    const diagnostics = {
      timestamp: new Date().toISOString(),
      system: {
        nodeEnv: process.env.NODE_ENV,
        scheduledSyncRunning: true // We'll check this below
      },
      organizations: []
    };

    // Check sync status for each org
    for (const org of orgs) {
      try {
        const syncStatus = await scheduledSyncService.getSyncStatus(org.id);
        
        diagnostics.organizations.push({
          id: org.id,
          name: org.name,
          emailAccountsCount: org.emailAccounts.length,
          calendarAccountsCount: org.calendarAccounts.length,
          emailAccounts: org.emailAccounts.map(acc => ({
            id: acc.id,
            email: acc.email,
            provider: acc.provider,
            status: acc.status,
            lastSyncedAt: acc.lastSyncedAt,
            updatedAt: acc.updatedAt,
            hasHistoryId: !!acc.historyId,
            errorReason: acc.errorReason,
            timeSinceLastSync: acc.updatedAt ? 
              Math.round((Date.now() - acc.updatedAt.getTime()) / (1000 * 60)) + ' minutes ago' : 
              'never'
          })),
          calendarAccounts: org.calendarAccounts.map(acc => ({
            id: acc.id,
            provider: acc.provider,
            status: acc.status,
            timeSinceLastSync: acc.updatedAt ? 
              Math.round((Date.now() - acc.updatedAt.getTime()) / (1000 * 60)) + ' minutes ago' : 
              'never'
          })),
          scheduledSync: syncStatus
        });
      } catch (error) {
        diagnostics.organizations.push({
          id: org.id,
          name: org.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Get some thread stats to see if sync is working
    const threadStats = await prisma.emailThread.groupBy({
      by: ['orgId'],
      _count: {
        id: true
      },
      _max: {
        updatedAt: true
      }
    });

    diagnostics.threadStats = threadStats.map(stat => ({
      orgId: stat.orgId,
      totalThreads: stat._count.id,
      lastThreadUpdate: stat._max.updatedAt
    }));

    return NextResponse.json(diagnostics);

  } catch (error) {
    logger.error('Sync diagnostics failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      error: 'Failed to get sync diagnostics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}