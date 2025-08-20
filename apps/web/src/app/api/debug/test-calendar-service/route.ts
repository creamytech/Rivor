import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { GoogleCalendarService } from '@/server/calendar';

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

    // Get calendar accounts
    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: { orgId, provider: 'google' }
    });

    if (calendarAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No calendar accounts found'
      });
    }

    const testResults = [];
    
    for (const account of calendarAccounts) {
      try {
        // Test calendar service creation
        const calendarService = await GoogleCalendarService.createFromAccount(orgId, account.id);
        const calendar = await calendarService.getCalendar();
        
        // Test calendar list access
        const calendarList = await calendar.calendarList.list();
        
        // Test primary calendar access
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const eventsResponse = await calendar.events.list({
          calendarId: 'primary',
          timeMin: thirtyDaysAgo.toISOString(),
          timeMax: thirtyDaysFromNow.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 10
        });

        testResults.push({
          accountId: account.id,
          status: 'success',
          calendarList: {
            totalCalendars: calendarList.data.items?.length || 0,
            primaryCalendar: calendarList.data.items?.find(c => c.primary)?.summary || 'Unknown'
          },
          events: {
            totalEvents: eventsResponse.data.items?.length || 0,
            sampleEvents: eventsResponse.data.items?.slice(0, 3).map(event => ({
              id: event.id,
              summary: event.summary,
              start: event.start,
              end: event.end
            })) || []
          }
        });

      } catch (error) {
        testResults.push({
          accountId: account.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      calendarAccounts: calendarAccounts.map(acc => ({
        id: acc.id,
        provider: acc.provider,
        status: acc.status
      })),
      testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to test calendar service:', error);
    return NextResponse.json(
      { error: 'Failed to test calendar service', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
