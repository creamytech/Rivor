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

    // Build query conditions
    const where: any = { orgId };
    
    if (startDate && endDate) {
      where.start = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get events from our database
    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { start: 'asc' },
      take: limit,
      select: {
        id: true,
        start: true,
        end: true,
        titleIndex: true,
        locationIndex: true,
        notesEnc: true,
        attendeesEnc: true
      }
    });

    // Transform events to match expected format
    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.titleIndex || 'Untitled Event',
      description: '', // We can decrypt notesEnc if needed
      start: event.start,
      end: event.end,
      location: event.locationIndex || '',
      attendees: [], // We can decrypt attendeesEnc if needed
      htmlLink: '',
      isAllDay: false // We can determine this from start/end times if needed
    }));

    return NextResponse.json({ events: transformedEvents });

  } catch (error) {
    logger.error('Failed to fetch calendar events', { error });
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
