import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

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

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch insights in parallel
    const [
      todayEmails,
      upcomingEvents,
      activeLeads,
      emailAccounts
    ] = await Promise.all([
      // Today's emails
      prisma.emailThread.count({
        where: {
          orgId,
          updatedAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      
      // Upcoming events (next 7 days)
      prisma.calendarEvent.count({
        where: {
          orgId,
          start: {
            gte: today,
            lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Active leads
      prisma.lead.count({
        where: {
          orgId,
          status: {
            not: 'closed_lost'
          }
        }
      }),
      
      // Email accounts for connection status
      prisma.emailAccount.findMany({
        where: { orgId },
        select: {
          status: true,
          encryptionStatus: true
        }
      })
    ]);

    // Determine connection status
    let connectionStatus: 'connected' | 'partial' | 'none' = 'none';
    if (emailAccounts.length > 0) {
      const connectedAccounts = emailAccounts.filter(acc => 
        acc.status === 'connected' && acc.encryptionStatus === 'ok'
      );
      
      if (connectedAccounts.length === emailAccounts.length) {
        connectionStatus = 'connected';
      } else if (connectedAccounts.length > 0) {
        connectionStatus = 'partial';
      }
    }

    const insights = {
      todayEmails,
      upcomingEvents,
      activeLeads,
      connectionStatus
    };

    logger.info('Flow insights fetched', { 
      orgId, 
      insights 
    });

    return NextResponse.json(insights);

  } catch (error) {
    logger.error('Failed to fetch flow insights', { error });
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
