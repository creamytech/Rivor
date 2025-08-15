import { prisma } from './db';
import { decryptForOrg } from './crypto';

export type UiCalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string;
  provider: string;
};

/**
 * Get upcoming calendar events for an organization
 */
export async function getUpcomingEvents(orgId: string, limit = 10): Promise<UiCalendarEvent[]> {
  const now = new Date();
  const raws = await prisma.calendarEvent.findMany({
    where: {
      orgId,
      start: {
        gte: now
      }
    },
    orderBy: { start: 'asc' },
    take: limit,
    select: { 
      id: true, 
      titleEnc: true, 
      locationEnc: true, 
      attendeesEnc: true,
      start: true, 
      end: true,
      account: {
        select: { provider: true }
      }
    },
  });

  const events: UiCalendarEvent[] = [];
  for (const event of raws) {
    let title = '';
    let location = '';
    let attendees = '';

    if (event.titleEnc) {
      try {
        const dec = await decryptForOrg(orgId, event.titleEnc, 'calendar:title');
        title = new TextDecoder().decode(dec);
      } catch {
        title = '(encrypted)';
      }
    }

    if (event.locationEnc) {
      try {
        const dec = await decryptForOrg(orgId, event.locationEnc, 'calendar:location');
        location = new TextDecoder().decode(dec);
      } catch {
        location = '';
      }
    }

    if (event.attendeesEnc) {
      try {
        const dec = await decryptForOrg(orgId, event.attendeesEnc, 'calendar:attendees');
        attendees = new TextDecoder().decode(dec);
      } catch {
        attendees = '';
      }
    }

    events.push({
      id: event.id,
      title,
      start: event.start,
      end: event.end,
      location,
      attendees,
      provider: event.account.provider
    });
  }

  return events;
}

/**
 * Get calendar statistics for an organization
 */
export async function getCalendarStats(orgId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [todayCount, upcomingCount] = await Promise.all([
    prisma.calendarEvent.count({
      where: {
        orgId,
        start: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    }),
    prisma.calendarEvent.count({
      where: {
        orgId,
        start: {
          gte: now
        }
      }
    })
  ]);

  return {
    todayCount,
    upcomingCount
  };
}
