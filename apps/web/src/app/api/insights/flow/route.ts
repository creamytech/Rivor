import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { mixWithDemoData, demoEmails, demoCalendarEvents, demoLeads } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

/**
 * Flow insights endpoint for hero card
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Check connection status with schema compatibility
    let emailAccounts;
    let connectionStatus: 'connected' | 'partial' | 'none' = 'none';
    
    try {
      // Try modern schema first
      emailAccounts = await prisma.emailAccount.findMany({
        where: { orgId },
        select: {
          status: true,
          encryptionStatus: true,
          tokenStatus: true
        }
      });
      
      // Modern schema logic
      if (emailAccounts.length > 0) {
        const connectedAccounts = emailAccounts.filter(acc => 
          acc.status === 'connected' && 
          (acc as any).encryptionStatus === 'ok' && 
          (acc as any).tokenStatus === 'encrypted'
        ).length;
        
        if (connectedAccounts === emailAccounts.length) {
          connectionStatus = 'connected';
        } else if (connectedAccounts > 0) {
          connectionStatus = 'partial';
        }
      }
    } catch (error) {
      // Fallback to basic schema
      try {
        emailAccounts = await prisma.emailAccount.findMany({
          where: { orgId },
          select: {
            status: true
          }
        });
        
        // Basic schema logic - just check if any accounts are connected
        if (emailAccounts.length > 0) {
          const connectedAccounts = emailAccounts.filter(acc => 
            acc.status === 'connected'
          ).length;
          
          if (connectedAccounts === emailAccounts.length) {
            connectionStatus = 'connected';
          } else if (connectedAccounts > 0) {
            connectionStatus = 'partial';
          }
        }
      } catch (basicError) {
        console.error('Failed to fetch email accounts:', basicError);
        emailAccounts = [];
      }
    }

    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: { orgId }
    });

    // Override connection status if we have accounts but no modern fields
    if (emailAccounts.length > 0 && connectionStatus === 'none') {
      connectionStatus = 'partial'; // Show as partial since we can't verify full status
    }

    // Get today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's emails
    const todayEmailsReal = await prisma.emailMessage.count({
      where: {
        orgId,
        sentAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Upcoming events (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingEventsReal = await prisma.calendarEvent.count({
      where: {
        orgId,
        start: {
          gte: new Date(),
          lte: nextWeek
        }
      }
    });

    // Active leads
    const activeLeadsReal = await prisma.lead.count({
      where: {
        orgId,
        status: 'active'
      }
    });

    // Mix with demo data if enabled
    const todayEmails = mixWithDemoData(
      [{ count: todayEmailsReal }], 
      [{ count: demoEmails.length }]
    )[0]?.count || 0;

    const upcomingEvents = mixWithDemoData(
      [{ count: upcomingEventsReal }], 
      [{ count: demoCalendarEvents.length }]
    )[0]?.count || 0;

    const activeLeads = mixWithDemoData(
      [{ count: activeLeadsReal }], 
      [{ count: demoLeads.length }]
    )[0]?.count || 0;

    const response = {
      todayEmails,
      upcomingEvents,
      activeLeads,
      connectionStatus
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Flow insights API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flow insights' },
      { status: 500 }
    );
  }
}
