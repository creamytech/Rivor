import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
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

    // Get calendar account
    const calendarAccount = await prisma.calendarAccount.findFirst({
      where: { orgId, provider: 'google' }
    });

    // Get secure tokens for calendar
    const secureTokens = await prisma.secureToken.findMany({
      where: {
        orgId,
        provider: 'google',
        encryptionStatus: 'ok'
      }
    });

    // Get calendar events count
    const eventsCount = await prisma.calendarEvent.count({
      where: { orgId }
    });

    // Test calendar service if account exists
    let calendarTest = null;
    if (calendarAccount) {
      try {
        const calendarService = await GoogleCalendarService.createFromAccount(orgId, calendarAccount.id);
        const calendar = await calendarService.getCalendar();
        
        // Test calendar access
        const calendars = await calendar.calendarList.list();
        calendarTest = {
          success: true,
          calendars: calendars.data.items?.length || 0,
          primaryCalendar: calendars.data.items?.find(c => c.primary)?.summary || 'Unknown'
        };
      } catch (error) {
        calendarTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json({
      orgId,
      calendarAccount: calendarAccount ? {
        id: calendarAccount.id,
        provider: calendarAccount.provider,
        status: calendarAccount.status,
        createdAt: calendarAccount.createdAt,
        updatedAt: calendarAccount.updatedAt
      } : null,
      secureTokens: {
        total: secureTokens.length,
        byType: secureTokens.reduce((acc, token) => {
          acc[token.tokenType] = (acc[token.tokenType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      eventsCount,
      calendarTest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get calendar status:', error);
    return NextResponse.json(
      { error: 'Failed to get calendar status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
