import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { mixWithDemoData, demoCalendarEvents } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

/**
 * Get calendar events
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');

    const start = startParam ? new Date(startParam) : new Date();
    const end = endParam ? new Date(endParam) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Get events from database
    const events = await prisma.calendarEvent.findMany({
      where: {
        orgId,
        start: {
          gte: start,
          lte: end
        }
      },
      orderBy: { start: 'asc' }
    });

    // Transform to UI format
    const eventsFormatted = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.start,
      end: event.end,
      location: event.location,
      attendees: event.attendees ? JSON.parse(event.attendees) : [],
      isVideoCall: event.isVideoCall,
      isAllDay: event.isAllDay,
      color: event.color
    }));

    // Mix with demo data if enabled
    const demoEventsInRange = demoCalendarEvents.filter(event => {
      const eventStart = new Date(event.start);
      return eventStart >= start && eventStart <= end;
    }).map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      attendees: event.attendees,
      isVideoCall: false,
      isAllDay: false
    }));

    const finalEvents = mixWithDemoData(eventsFormatted, demoEventsInRange);

    const response = {
      events: finalEvents,
      total: finalEvents.length
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Calendar events API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

/**
 * Create calendar event
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await req.json();
    const {
      title,
      description,
      start,
      end,
      location,
      attendees,
      isVideoCall,
      isAllDay
    } = body;

    if (!title || !start || !end) {
      return NextResponse.json(
        { error: 'Title, start, and end are required' },
        { status: 400 }
      );
    }

    // Create event in database
    const event = await prisma.calendarEvent.create({
      data: {
        orgId,
        title,
        description: description || null,
        start: new Date(start),
        end: new Date(end),
        location: location || null,
        attendees: attendees ? JSON.stringify(attendees) : null,
        isVideoCall: isVideoCall || false,
        isAllDay: isAllDay || false,
        color: '#14b8a6', // Default teal color
        status: 'confirmed'
      }
    });

    // TODO: Sync with Google Calendar if calendar integration is available
    // This would require:
    // 1. Getting calendar account for this org
    // 2. Using Google Calendar API to create event
    // 3. Storing the external event ID for future updates/deletions

    // Transform to UI format
    const eventFormatted = {
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.start,
      end: event.end,
      location: event.location,
      attendees: event.attendees ? JSON.parse(event.attendees) : [],
      isVideoCall: event.isVideoCall,
      isAllDay: event.isAllDay,
      color: event.color
    };

    return NextResponse.json(eventFormatted);

  } catch (error: any) {
    console.error('Calendar event creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
