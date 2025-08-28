import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Get meetings for the organization
 */
export async function GET(req: NextRequest) {
  try {
    // Development bypass - return mock data
    if (process.env.NODE_ENV === 'development') {
      const mockMeetings = [
        {
          id: 'mock-1',
          title: 'Property Showing - 123 Main St',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
          time: '14:00',
          attendees: 'sarah.johnson@example.com, john.doe@example.com',
          notes: 'Property showing for potential buyers. Prepare listing materials.',
          status: 'scheduled',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'mock-2',
          title: 'Client Consultation - Investment Portfolio',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
          time: '10:30',
          attendees: 'michael.chen@techcorp.com',
          notes: 'Discuss commercial real estate investment opportunities.',
          status: 'scheduled',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ];

      return NextResponse.json({
        meetings: mockMeetings,
        total: mockMeetings.length
      });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // For now, return empty array since we don't have a meetings table
    // This would be where you'd query your meetings table
    const meetings: any[] = [];

    return NextResponse.json({
      meetings,
      total: meetings.length
    });

  } catch (error: unknown) {
    console.error('Meetings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}

/**
 * Create new meeting
 */
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

    const body = await req.json();
    const {
      title,
      date,
      time,
      attendees,
      notes
    } = body;

    if (!title || !date || !time) {
      return NextResponse.json(
        { error: 'Title, date, and time are required' },
        { status: 400 }
      );
    }

    // For now, just return a success response with the data
    // In a real implementation, you'd save this to a meetings table
    // and potentially integrate with calendar APIs
    const meeting = {
      id: `meeting_${Date.now()}`,
      title,
      date,
      time,
      attendees: attendees || '',
      notes: notes || '',
      status: 'scheduled',
      orgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Log the meeting creation for now
    console.log('New meeting scheduled:', meeting);

    // In a real implementation, you might also:
    // 1. Create calendar events
    // 2. Send email invitations to attendees
    // 3. Set up reminders
    // 4. Integrate with calendar services (Google Calendar, Outlook, etc.)

    return NextResponse.json({
      success: true,
      meeting
    });

  } catch (error: unknown) {
    console.error('Meeting creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule meeting' },
      { status: 500 }
    );
  }
}