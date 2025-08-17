import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logger } from '@/lib/logger';
import { GoogleCalendarService } from '@/server/calendar';

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

    const {
      title,
      description,
      start,
      end,
      location,
      attendees,
      isAllDay,
      threadId
    } = await req.json();

    // Validate required fields
    if (!title || !start || !end) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get calendar account
    const calendarAccount = await prisma.calendarAccount.findFirst({
      where: { orgId, provider: 'google' }
    });

    if (!calendarAccount) {
      return NextResponse.json({ error: 'No calendar account found' }, { status: 400 });
    }

    // Create calendar service
    const calendarService = await GoogleCalendarService.createFromAccount(orgId, calendarAccount.id);
    const calendar = await calendarService.getCalendar();

    // Prepare event data
    const eventData: any = {
      summary: title,
      description: description || '',
      start: {
        dateTime: isAllDay ? undefined : start,
        date: isAllDay ? start.split('T')[0] : undefined,
        timeZone: 'UTC'
      },
      end: {
        dateTime: isAllDay ? undefined : end,
        date: isAllDay ? end.split('T')[0] : undefined,
        timeZone: 'UTC'
      }
    };

    // Add location if provided
    if (location) {
      eventData.location = location;
    }

    // Add attendees if provided
    if (attendees && attendees.length > 0) {
      eventData.attendees = attendees.map((email: string) => ({ email }));
    }

    // Add thread link if provided
    if (threadId) {
      const threadUrl = `${process.env.NEXTAUTH_URL}/app/inbox/${threadId}`;
      eventData.description = `${eventData.description}\n\nRelated email thread: ${threadUrl}`;
    }

    // Create event in Google Calendar
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventData,
      sendUpdates: 'all'
    });

    // Save event to database
    const savedEvent = await prisma.calendarEvent.create({
      data: {
        accountId: calendarAccount.id,
        orgId,
        start: new Date(event.data.start?.dateTime || event.data.start?.date!),
        end: new Date(event.data.end?.dateTime || event.data.end?.date!),
        titleEnc: null, // Will be encrypted if needed
        titleIndex: event.data.summary || title,
        locationIndex: event.data.location || location || '',
        notesEnc: null,
        attendeesEnc: null
      }
    });

    logger.info('Calendar event created', { 
      eventId: event.data.id,
      title,
      orgId 
    });

    return NextResponse.json({
      success: true,
      event: {
        id: savedEvent.id,
        eventId: event.data.id,
        title: event.data.summary,
        description: event.data.description,
        start: event.data.start,
        end: event.data.end,
        location: event.data.location,
        attendees: event.data.attendees,
        htmlLink: event.data.htmlLink
      }
    });

  } catch (error) {
    logger.error('Failed to create calendar event', { error });
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
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

    const url = new URL(req.url);
    const startDate = url.searchParams.get('start');
    const endDate = url.searchParams.get('end');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Get calendar account
    const calendarAccount = await prisma.calendarAccount.findFirst({
      where: { orgId, provider: 'google' }
    });

    if (!calendarAccount) {
      return NextResponse.json({ error: 'No calendar account found' }, { status: 400 });
    }

    // Create calendar service
    const calendarService = await GoogleCalendarService.createFromAccount(orgId, calendarAccount.id);
    const calendar = await calendarService.getCalendar();

    // Prepare query parameters
    const params: any = {
      calendarId: 'primary',
      maxResults: limit,
      singleEvents: true,
      orderBy: 'startTime'
    };

    if (startDate) {
      params.timeMin = startDate;
    }
    if (endDate) {
      params.timeMax = endDate;
    }

    // Get events from Google Calendar
    const response = await calendar.events.list(params);

    const events = response.data.items?.map(event => ({
      id: event.id,
      title: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
      location: event.location,
      attendees: event.attendees,
      htmlLink: event.htmlLink,
      isAllDay: !event.start?.dateTime
    })) || [];

    return NextResponse.json({ events });

  } catch (error) {
    logger.error('Failed to fetch calendar events', { error });
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
