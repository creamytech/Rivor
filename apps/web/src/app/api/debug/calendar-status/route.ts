import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        authenticated: false
      }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ 
        error: 'No organization found',
        session: {
          userEmail: session.user.email,
          hasOrgId: false
        }
      }, { status: 400 });
    }

    logger.info('Debug calendar status check', {
      userEmail: session.user.email,
      orgId,
      action: 'debug_calendar_status'
    });

    // Step-by-step debugging
    const debugInfo = {
      session: {
        authenticated: true,
        userEmail: session.user.email,
        orgId: orgId
      },
      database: {
        connected: false,
        error: null
      },
      calendarAccount: {
        found: false,
        data: null,
        error: null
      },
      eventCount: {
        count: 0,
        error: null
      }
    };

    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      debugInfo.database.connected = true;
    } catch (dbError) {
      debugInfo.database.error = dbError instanceof Error ? dbError.message : 'Unknown DB error';
    }

    // Test calendar account query
    try {
      const calendarAccount = await prisma.calendarAccount.findFirst({
        where: {
          orgId,
          provider: 'google'
        },
        select: {
          id: true,
          status: true,
          lastSyncedAt: true,
          provider: true,
          createdAt: true,
          updatedAt: true
        }
      });

      debugInfo.calendarAccount.found = !!calendarAccount;
      debugInfo.calendarAccount.data = calendarAccount;

    } catch (accountError) {
      debugInfo.calendarAccount.error = accountError instanceof Error ? accountError.message : 'Unknown account error';
    }

    // Test event count query
    if (debugInfo.calendarAccount.found && debugInfo.calendarAccount.data) {
      try {
        const eventCount = await prisma.calendarEvent.count({
          where: {
            orgId,
            accountId: debugInfo.calendarAccount.data.id
          }
        });
        debugInfo.eventCount.count = eventCount;
      } catch (eventError) {
        debugInfo.eventCount.error = eventError instanceof Error ? eventError.message : 'Unknown event error';
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar status debug completed',
      debug: debugInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Debug calendar status error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      action: 'debug_calendar_status_error'
    });

    return NextResponse.json({
      success: false,
      error: 'Debug calendar status failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}