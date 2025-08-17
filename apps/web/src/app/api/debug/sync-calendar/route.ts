import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { GoogleCalendarService } from '@/server/calendar';
import { logger } from '@/lib/logger';

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
      where: { orgId, provider: 'google' }
    });

    if (calendarAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No calendar accounts found. Please setup calendar first.'
      }, { status: 400 });
    }

    const syncResults = [];
    
    for (const account of calendarAccounts) {
      try {
        // Create calendar service
        const calendarService = await GoogleCalendarService.createFromAccount(orgId, account.id);
        const calendar = await calendarService.getCalendar();

        // Get events from the last 30 days to next 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: thirtyDaysAgo.toISOString(),
          timeMax: thirtyDaysFromNow.toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        });

        const events = response.data.items || [];
        let syncedCount = 0;
        let updatedCount = 0;

        for (const event of events) {
          if (!event.id) continue;

          // Check if event already exists
          const existingEvent = await prisma.calendarEvent.findFirst({
            where: {
              accountId: account.id,
              titleIndex: event.summary || ''
            }
          });

          if (existingEvent) {
            // Update existing event
            await prisma.calendarEvent.update({
              where: { id: existingEvent.id },
              data: {
                start: new Date(event.start?.dateTime || event.start?.date!),
                end: new Date(event.end?.dateTime || event.end?.date!),
                titleIndex: event.summary || '',
                locationIndex: event.location || ''
              }
            });
            updatedCount++;
          } else {
            // Create new event
            await prisma.calendarEvent.create({
              data: {
                accountId: account.id,
                orgId,
                start: new Date(event.start?.dateTime || event.start?.date!),
                end: new Date(event.end?.dateTime || event.end?.date!),
                titleEnc: null,
                titleIndex: event.summary || '',
                locationIndex: event.location || '',
                notesEnc: null,
                attendeesEnc: null
              }
            });
            syncedCount++;
          }
        }

        syncResults.push({
          accountId: account.id,
          provider: account.provider,
          status: 'success',
          eventsProcessed: events.length,
          eventsCreated: syncedCount,
          eventsUpdated: updatedCount,
          eventsSkipped: events.length - syncedCount - updatedCount
        });

      } catch (error) {
        syncResults.push({
          accountId: account.id,
          provider: account.provider,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Manual calendar sync completed', {
      orgId,
      accountsCount: calendarAccounts.length,
      syncResults
    });

    return NextResponse.json({
      success: true,
      message: `Calendar sync completed for ${calendarAccounts.length} account(s)`,
      results: syncResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to trigger calendar sync:', error);
    return NextResponse.json(
      { error: 'Failed to trigger calendar sync', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
