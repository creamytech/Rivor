import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { decryptForOrg } from '@/server/crypto';

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

    // Check calendar accounts
    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        provider: true,
        status: true,
        channelId: true,
        channelResourceId: true,
        channelExpiration: true,
        webhookEndpoint: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Check total calendar events
    const totalEvents = await prisma.calendarEvent.count({
      where: { orgId }
    });

    // Get a few sample events
    const sampleEvents = await prisma.calendarEvent.findMany({
      where: { orgId },
      select: {
        id: true,
        titleEnc: true,
        locationEnc: true,
        start: true,
        end: true,
        createdAt: true
      },
      orderBy: { start: 'desc' },
      take: 5
    });

    // Try to decrypt one event to test
    let decryptionTest = null;
    if (sampleEvents.length > 0) {
      try {
        const event = sampleEvents[0];
        if (event.titleEnc) {
          const titleBytes = await decryptForOrg(orgId, event.titleEnc, 'calendar:title');
          const title = new TextDecoder().decode(titleBytes);
          decryptionTest = {
            success: true,
            originalTitle: title,
            eventId: event.id
          };
        } else {
          decryptionTest = {
            success: false,
            reason: 'No encrypted title data'
          };
        }
      } catch (error) {
        decryptionTest = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    // Check upcoming events (next 7 days)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcomingEvents = await prisma.calendarEvent.count({
      where: {
        orgId,
        start: {
          gte: now,
          lte: nextWeek
        }
      }
    });

    return NextResponse.json({
      success: true,
      orgId,
      calendarAccounts: {
        total: calendarAccounts.length,
        connected: calendarAccounts.filter(a => a.status === 'connected').length,
        accounts: calendarAccounts
      },
      events: {
        total: totalEvents,
        upcoming: upcomingEvents,
        sample: sampleEvents.map(e => ({
          id: e.id,
          hasTitle: !!e.titleEnc,
          hasLocation: !!e.locationEnc,
          start: e.start,
          end: e.end,
          createdAt: e.createdAt
        }))
      },
      decryptionTest
    });

  } catch (error) {
    console.error('Calendar status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check calendar status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
