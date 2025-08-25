import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
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

    // Encrypt data before saving to database
    const { encryptForOrg } = await import('@/server/crypto');
    const titleEnc = await encryptForOrg(orgId, event.data.summary || title, 'calendar:title');
    const locationEnc = event.data.location ? await encryptForOrg(orgId, event.data.location, 'calendar:location') : null;
    const notesEnc = description ? await encryptForOrg(orgId, description, 'calendar:notes') : null;
    const attendeesEnc = attendees && attendees.length > 0 ? await encryptForOrg(orgId, JSON.stringify(attendees), 'calendar:attendees') : null;
    
    // Save event to database
    const savedEvent = await prisma.calendarEvent.create({
      data: {
        accountId: calendarAccount.id,
        orgId,
        start: new Date(event.data.start?.dateTime || event.data.start?.date!),
        end: new Date(event.data.end?.dateTime || event.data.end?.date!),
        titleEnc,
        locationEnc,
        notesEnc,
        attendeesEnc
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
        titleEnc: true,
        locationEnc: true,
        notesEnc: true,
        attendeesEnc: true
      }
    });

    // Decrypt and transform events to match expected format
    const transformedEvents = await Promise.all(events.map(async (event) => {
      let title = 'Untitled Event';
      let location = '';
      let description = '';
      let attendees: any[] = [];
      
      // Decrypt title
      if (event.titleEnc) {
        try {
          const { decryptForOrg } = await import('@/server/crypto');
          const titleBytes = await decryptForOrg(orgId, event.titleEnc, 'calendar:title');
          title = new TextDecoder().decode(titleBytes);
        } catch (error) {
          logger.warn('Failed to decrypt event title', { eventId: event.id, error });
        }
      }
      
      // Decrypt location
      if (event.locationEnc) {
        try {
          const { decryptForOrg } = await import('@/server/crypto');
          const locationBytes = await decryptForOrg(orgId, event.locationEnc, 'calendar:location');
          location = new TextDecoder().decode(locationBytes);
        } catch (error) {
          logger.warn('Failed to decrypt event location', { eventId: event.id, error });
        }
      }
      
      // Decrypt notes/description
      if (event.notesEnc) {
        try {
          const { decryptForOrg } = await import('@/server/crypto');
          const notesBytes = await decryptForOrg(orgId, event.notesEnc, 'calendar:notes');
          description = new TextDecoder().decode(notesBytes);
        } catch (error) {
          logger.warn('Failed to decrypt event notes', { eventId: event.id, error });
        }
      }
      
      // Decrypt attendees if available
      if (event.attendeesEnc) {
        try {
          const { decryptForOrg } = await import('@/server/crypto');
          const attendeesBytes = await decryptForOrg(orgId, event.attendeesEnc, 'calendar:attendees');
          const attendeesStr = new TextDecoder().decode(attendeesBytes);
          attendees = JSON.parse(attendeesStr) || [];
        } catch (error) {
          logger.warn('Failed to decrypt event attendees', { eventId: event.id, error });
        }
      }
      
      return {
        id: event.id,
        title,
        description,
        start: event.start,
        end: event.end,
        location,
        attendees,
        htmlLink: '',
        isAllDay: false // We can determine this from start/end times if needed
      };
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
