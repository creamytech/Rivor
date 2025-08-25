import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { GoogleCalendarService } from '@/server/calendar';
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

    // Get the user's Calendar account
    let calendarAccount = await prisma.calendarAccount.findFirst({
      where: {
        orgId,
        provider: 'google'
      }
    });

    // Auto-create calendar account if it doesn't exist but email account does
    if (!calendarAccount) {
      const emailAccount = await prisma.emailAccount.findFirst({
        where: {
          orgId,
          provider: 'google'
        }
      });

      if (!emailAccount) {
        return NextResponse.json({ 
          error: 'No connected Google account found',
          message: 'Please connect your Google account first in Settings → Integrations',
          action: 'connect_google_first'
        }, { status: 404 });
      }

      if (!emailAccount.externalAccountId) {
        return NextResponse.json({ 
          error: 'Google account missing external ID',
          message: 'Please reconnect your Google account',
          action: 'reconnect_google'
        }, { status: 400 });
      }

      // Create calendar account
      calendarAccount = await prisma.calendarAccount.create({
        data: {
          orgId,
          provider: 'google',
          status: 'connected'
        }
      });

      logger.info('Auto-created calendar account during sync', {
        orgId,
        calendarAccountId: calendarAccount.id
      });
    }

    logger.info('Manual Calendar sync initiated', {
      orgId,
      calendarAccountId: calendarAccount.id,
      userEmail: session.user.email,
      action: 'manual_calendar_sync_start'
    });

    // Create Calendar service instance
    const calendarService = await GoogleCalendarService.createFromAccount(orgId, calendarAccount.id);

    // Perform sync - get events from 30 days ago to 90 days in the future
    const result = await calendarService.syncEvents(orgId, calendarAccount.id, 30, 90);

    // Update last sync time (using updatedAt as sync timestamp)
    await prisma.calendarAccount.update({
      where: { id: calendarAccount.id },
      data: { 
        status: 'connected',
        updatedAt: new Date()
      }
    });

    logger.info('Manual Calendar sync completed', {
      orgId,
      calendarAccountId: calendarAccount.id,
      userEmail: session.user.email,
      result,
      action: 'manual_calendar_sync_complete'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Calendar sync completed successfully',
      lastSyncedAt: new Date().toISOString(),
      stats: result
    });

  } catch (error) {
    logger.error('Manual Calendar sync failed', {
      error: error instanceof Error ? error.message : String(error),
      action: 'manual_calendar_sync_failed'
    });

    // Check if it's an authentication error
    if (error && typeof error === 'object' && 'code' in error && error.code === 401) {
      return NextResponse.json({ 
        error: 'Authentication failed - please reconnect your Google Calendar',
        action: 'reauthenticate_calendar'
      }, { status: 401 });
    }

    return NextResponse.json({ 
      error: 'Calendar sync failed',
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
    const calendarAccount = await prisma.calendarAccount.findFirst({
      where: {
        orgId,
        provider: 'google'
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        provider: true
      }
    });

    if (!calendarAccount) {
      return NextResponse.json({
        connected: false,
        message: 'No Google Calendar account connected'
      });
    }

    // Get event count
    const eventCount = await prisma.calendarEvent.count({
      where: {
        orgId,
        accountId: calendarAccount.id
      }
    });

    return NextResponse.json({
      connected: calendarAccount.status === 'connected',
      status: calendarAccount.status,
      lastSyncedAt: calendarAccount.updatedAt?.toISOString(),
      provider: calendarAccount.provider,
      eventCount
    });

  } catch (error) {
    logger.error('Failed to get Calendar sync status', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({ 
      error: 'Failed to get sync status' 
    }, { status: 500 });
  }
}