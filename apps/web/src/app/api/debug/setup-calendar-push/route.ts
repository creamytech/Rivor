import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { GoogleCalendarService } from '@/server/calendar';
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

    // Get calendar accounts
    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: { orgId, provider: 'google', status: 'connected' }
    });

    if (calendarAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No connected calendar accounts found'
      }, { status: 400 });
    }

    const setupResults = [];
    
    for (const account of calendarAccounts) {
      try {
        // Create calendar service
        const calendarService = await GoogleCalendarService.createFromAccount(orgId, account.id);
        
        // Setup push notifications
        await calendarService.setupPushNotifications(orgId, account.id);
        
        setupResults.push({
          accountId: account.id,
          provider: account.provider,
          status: 'success',
          message: 'Push notifications setup successful'
        });
        
      } catch (error) {
        setupResults.push({
          accountId: account.id,
          provider: account.provider,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    logger.info('Calendar push notifications setup completed', {
      orgId,
      accountsCount: calendarAccounts.length,
      setupResults
    });

    return NextResponse.json({
      success: true,
      message: `Calendar push notifications setup completed for ${calendarAccounts.length} account(s)`,
      results: setupResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to setup calendar push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to setup calendar push notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
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

    // Get calendar account status
    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: { orgId, provider: 'google' }
    });

    return NextResponse.json({
      success: true,
      calendarAccounts: calendarAccounts.map(account => ({
        id: account.id,
        provider: account.provider,
        status: account.status,
        lastSyncedAt: account.lastSyncedAt,
        watchExpiration: account.watchExpiration,
        hasPushNotifications: account.watchExpiration && account.watchExpiration > new Date()
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to check calendar push notification status:', error);
    return NextResponse.json(
      { error: 'Failed to check calendar push notification status' },
      { status: 500 }
    );
  }
}
