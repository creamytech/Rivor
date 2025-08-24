import { google } from 'googleapis';
import { prisma } from './db';
import { decryptForOrg, encryptForOrg } from './crypto';
import { logger } from '@/lib/logger';

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
      titleIndex: true, 
      locationIndex: true, 
      notesEnc: true,
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
    let title = event.titleIndex || 'Untitled Event';
    let location = event.locationIndex || '';
    let attendees = '';

    // Try to decrypt notes if available
    if (event.notesEnc) {
      try {
        const dec = await decryptForOrg(orgId, event.notesEnc, 'calendar:notes');
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

export class GoogleCalendarService {
  private oauth2Client: import('google-auth-library').OAuth2Client;

  constructor(accessToken: string, refreshToken?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  static async createFromAccount(orgId: string, calendarAccountId: string): Promise<GoogleCalendarService> {
    // Get OAuth tokens for this account from the Account model
    const calendarAccount = await prisma.calendarAccount.findUnique({
      where: { id: calendarAccountId },
      include: { org: true },
    });

    if (!calendarAccount) {
      throw new Error(`Calendar account ${calendarAccountId} not found`);
    }

    // Get the email account to find the externalAccountId and user
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        orgId,
        provider: 'google'
      },
      include: {
        user: {
          include: {
            accounts: {
              where: {
                provider: 'google'
              }
            }
          }
        }
      }
    });

    if (!emailAccount?.externalAccountId) {
      throw new Error(`No Google email account with externalAccountId found for org ${orgId}`);
    }

    // Find the Google OAuth account for this user
    const googleAccount = emailAccount.user.accounts.find(acc => 
      acc.provider === 'google' && 
      acc.providerAccountId === emailAccount.externalAccountId
    );

    if (!googleAccount) {
      throw new Error(`No Google OAuth account found for calendar account ${calendarAccountId}`);
    }

    // Decrypt access token from Account model
    if (!googleAccount.access_token_enc) {
      throw new Error(`No encrypted access token found for Google calendar account ${calendarAccountId}`);
    }

    const accessTokenBytes = await decryptForOrg(
      orgId, 
      googleAccount.access_token_enc, 
      `oauth:${googleAccount.provider}:access`
    );
    const accessToken = new TextDecoder().decode(accessTokenBytes);

    // Decrypt refresh token (optional)
    let refreshToken: string | undefined;
    if (googleAccount.refresh_token_enc) {
      const refreshTokenBytes = await decryptForOrg(
        orgId, 
        googleAccount.refresh_token_enc, 
        `oauth:${googleAccount.provider}:refresh`
      );
      refreshToken = new TextDecoder().decode(refreshTokenBytes);
    }

    return new GoogleCalendarService(accessToken, refreshToken);
  }

  async getCalendar() {
    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  async getUpcomingEvents(orgId: string, limit = 10): Promise<UiCalendarEvent[]> {
    const now = new Date();
    
    const raws = await prisma.calendarEvent.findMany({
      where: {
        orgId,
        start: { gte: now }
      },
      orderBy: { start: 'asc' },
      take: limit,
      select: {
        id: true,
        titleIndex: true, // Changed from titleEnc
        locationIndex: true, // Changed from locationEnc
        notesEnc: true, // Added
        attendeesEnc: true,
        start: true,
        end: true,
        account: { select: { provider: true } }
      },
    });
    const events: UiCalendarEvent[] = [];
    for (const event of raws) {
      let title = event.titleIndex || 'Untitled Event'; // Use titleIndex directly
      let location = event.locationIndex || ''; // Use locationIndex directly
      let attendees = '';
      if (event.notesEnc) { // Decrypt notesEnc for attendees/description
        try {
          const dec = await decryptForOrg(orgId, event.notesEnc, 'calendar:notes');
          attendees = new TextDecoder().decode(dec);
        } catch {
          attendees = '';
        }
      }
      
      events.push({
        id: event.id,
        title,
        description: attendees,
        start: event.start,
        end: event.end,
        location,
        attendees: attendees ? attendees.split(',').map(a => a.trim()) : [],
        htmlLink: '',
        isAllDay: false
      });
    }
    return events;
  }

  async setupPushNotifications(orgId: string, calendarAccountId: string): Promise<void> {
    const calendar = await this.getCalendar();
    
    try {
      // Validate Pub/Sub topic configuration
      const topicName = process.env.GOOGLE_PUBSUB_TOPIC;
      if (!topicName) {
        throw new Error('GOOGLE_PUBSUB_TOPIC environment variable not set');
      }
      
      // Validate topic name format
      if (!topicName.match(/^projects\/[^\/]+\/topics\/[^\/]+$/)) {
        throw new Error(`Invalid topic format: ${topicName}. Expected: projects/<project>/topics/<topic-name>`);
      }

      logger.info('Setting up Calendar push notifications', {
        orgId,
        calendarAccountId,
        topicName,
        action: 'calendar_watch_setup'
      });

      // Set up Calendar push notifications
      const response = await calendar.events.watch({
        calendarId: 'primary',
        requestBody: {
          id: `calendar-watch-${orgId}-${Date.now()}`,
          type: 'web_hook',
          address: `${process.env.NEXTAUTH_URL}/api/calendar/push`,
          params: {
            ttl: '604800' // 7 days in seconds
          }
        }
      });

      // Store watch metadata
      const updateData: any = {
        status: 'connected',
        lastSyncedAt: new Date()
      };
      
      if (response.data.expiration) {
        updateData.watchExpiration = new Date(response.data.expiration);
        logger.info('Calendar watch expiration set', {
          orgId,
          calendarAccountId,
          expiration: updateData.watchExpiration.toISOString(),
          action: 'calendar_watch_expiration_set'
        });
      }
      
      await prisma.calendarAccount.update({
        where: { id: calendarAccountId },
        data: updateData
      });

      logger.info('Calendar push notifications setup successful', {
        orgId,
        calendarAccountId,
        expiration: response.data.expiration || undefined,
        action: 'calendar_watch_success'
      });
      
    } catch (error: unknown) {
      logger.error('Calendar push notifications setup failed', {
        orgId,
        calendarAccountId,
        error: error instanceof Error ? error.message : String(error),
        action: 'calendar_watch_failed'
      });
      
      // Update account status on failure
      await prisma.calendarAccount.update({
        where: { id: calendarAccountId },
        data: { status: 'action_needed' }
      });
      
      throw error;
    }
  }

  async syncEvents(orgId: string, calendarAccountId: string, daysPast = 30, daysFuture = 30): Promise<{
    eventsProcessed: number;
    eventsCreated: number;
    eventsUpdated: number;
    eventsSkipped: number;
  }> {
    const calendar = await this.getCalendar();
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysPast);
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysFuture);

      logger.info('Starting calendar sync', {
        orgId,
        calendarAccountId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        action: 'calendar_sync_start'
      });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items || [];
      let eventsProcessed = 0;
      let eventsCreated = 0;
      let eventsUpdated = 0;
      let eventsSkipped = 0;

      for (const event of events) {
        eventsProcessed++;
        
        if (!event.id || !event.start) {
          eventsSkipped++;
          continue;
        }

        // Check if event already exists
        const existingEvent = await prisma.calendarEvent.findFirst({
          where: {
            orgId,
            accountId: calendarAccountId,
            start: new Date(event.start.dateTime || event.start.date!),
            end: new Date(event.end?.dateTime || event.end?.date!),
            titleIndex: event.summary || 'Untitled Event'
          }
        });

        const eventData = {
          orgId,
          accountId: calendarAccountId,
          start: new Date(event.start.dateTime || event.start.date!),
          end: new Date(event.end?.dateTime || event.end?.date!),
          titleIndex: event.summary || 'Untitled Event',
          locationIndex: event.location || '',
          notesEnc: event.description ? await encryptForOrg(orgId, event.description, 'calendar:notes') : null,
          attendeesEnc: event.attendees ? await encryptForOrg(orgId, JSON.stringify(event.attendees), 'calendar:attendees') : null
        };

        if (existingEvent) {
          // Update existing event
          await prisma.calendarEvent.update({
            where: { id: existingEvent.id },
            data: eventData
          });
          eventsUpdated++;
        } else {
          // Create new event
          await prisma.calendarEvent.create({
            data: eventData
          });
          eventsCreated++;
        }
      }

      // Update last synced timestamp
      await prisma.calendarAccount.update({
        where: { id: calendarAccountId },
        data: { lastSyncedAt: new Date() }
      });

      logger.info('Calendar sync completed', {
        orgId,
        calendarAccountId,
        eventsProcessed,
        eventsCreated,
        eventsUpdated,
        eventsSkipped,
        action: 'calendar_sync_complete'
      });

      return {
        eventsProcessed,
        eventsCreated,
        eventsUpdated,
        eventsSkipped
      };

    } catch (error: unknown) {
      logger.error('Calendar sync failed', {
        orgId,
        calendarAccountId,
        error: error instanceof Error ? error.message : String(error),
        action: 'calendar_sync_failed'
      });
      
      // Update account status if authentication failed
      if (error && typeof error === 'object' && 'code' in error && error.code === 401) {
        await prisma.calendarAccount.update({
          where: { id: calendarAccountId },
          data: { status: 'action_needed' }
        });
      }
      
      throw error;
    }
  }

  async handlePushNotification(orgId: string, calendarAccountId: string, resourceId: string): Promise<void> {
    const calendar = await this.getCalendar();
    
    try {
      logger.info('Processing calendar push notification', {
        orgId,
        calendarAccountId,
        resourceId,
        action: 'calendar_push_received'
      });

      // Get the calendar account to check last sync time
      const calendarAccount = await prisma.calendarAccount.findUnique({
        where: { id: calendarAccountId }
      });

      if (!calendarAccount?.lastSyncedAt) {
        // Full sync if no last sync time
        await this.syncEvents(orgId, calendarAccountId);
        return;
      }

      // Incremental sync - get events since last sync
      const lastSyncTime = calendarAccount.lastSyncedAt;
      const now = new Date();

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: lastSyncTime.toISOString(),
        timeMax: now.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items || [];
      
      for (const event of events) {
        if (!event.id || !event.start) continue;

        // Check if event already exists
        const existingEvent = await prisma.calendarEvent.findFirst({
          where: {
            orgId,
            accountId: calendarAccountId,
            start: new Date(event.start.dateTime || event.start.date!),
            end: new Date(event.end?.dateTime || event.end?.date!),
            titleIndex: event.summary || 'Untitled Event'
          }
        });

        const eventData = {
          orgId,
          accountId: calendarAccountId,
          start: new Date(event.start.dateTime || event.start.date!),
          end: new Date(event.end?.dateTime || event.end?.date!),
          titleIndex: event.summary || 'Untitled Event',
          locationIndex: event.location || '',
          notesEnc: event.description ? await encryptForOrg(orgId, event.description, 'calendar:notes') : null,
          attendeesEnc: event.attendees ? await encryptForOrg(orgId, JSON.stringify(event.attendees), 'calendar:attendees') : null
        };

        if (existingEvent) {
          // Update existing event
          await prisma.calendarEvent.update({
            where: { id: existingEvent.id },
            data: eventData
          });
        } else {
          // Create new event
          await prisma.calendarEvent.create({
            data: eventData
          });
        }
      }

      // Update last synced timestamp
      await prisma.calendarAccount.update({
        where: { id: calendarAccountId },
        data: { lastSyncedAt: new Date() }
      });

      logger.info('Calendar push notification processed', {
        orgId,
        calendarAccountId,
        eventsProcessed: events.length,
        action: 'calendar_push_processed'
      });

    } catch (error) {
      logger.error('Calendar push notification error:', error);
      throw error;
    }
  }

  /**
   * Create a calendar event in Google Calendar
   */
  async createEvent(eventData: {
    title: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
    attendees?: string[];
    isAllDay?: boolean;
  }): Promise<any> {
    const calendar = await this.getCalendar();

    const googleEventData: any = {
      summary: eventData.title,
      description: eventData.description || '',
      start: {
        dateTime: eventData.isAllDay ? undefined : eventData.start,
        date: eventData.isAllDay ? eventData.start.split('T')[0] : undefined,
        timeZone: 'UTC'
      },
      end: {
        dateTime: eventData.isAllDay ? undefined : eventData.end,
        date: eventData.isAllDay ? eventData.end.split('T')[0] : undefined,
        timeZone: 'UTC'
      }
    };

    if (eventData.location) {
      googleEventData.location = eventData.location;
    }

    if (eventData.attendees && eventData.attendees.length > 0) {
      googleEventData.attendees = eventData.attendees.map(email => ({ email }));
    }

    try {
      const event = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: googleEventData,
        sendUpdates: 'all'
      });

      logger.info('Calendar event created in Google Calendar', {
        eventId: event.data.id,
        title: eventData.title
      });

      return event.data;
    } catch (error) {
      logger.error('Failed to create event in Google Calendar', {
        error: error instanceof Error ? error.message : String(error),
        title: eventData.title
      });
      throw error;
    }
  }

  /**
   * Update a calendar event in Google Calendar
   */
  async updateEvent(eventId: string, eventData: {
    title?: string;
    description?: string;
    start?: string;
    end?: string;
    location?: string;
    attendees?: string[];
    isAllDay?: boolean;
  }): Promise<any> {
    const calendar = await this.getCalendar();

    const googleEventData: any = {};

    if (eventData.title !== undefined) {
      googleEventData.summary = eventData.title;
    }

    if (eventData.description !== undefined) {
      googleEventData.description = eventData.description;
    }

    if (eventData.start && eventData.end) {
      googleEventData.start = {
        dateTime: eventData.isAllDay ? undefined : eventData.start,
        date: eventData.isAllDay ? eventData.start.split('T')[0] : undefined,
        timeZone: 'UTC'
      };
      googleEventData.end = {
        dateTime: eventData.isAllDay ? undefined : eventData.end,
        date: eventData.isAllDay ? eventData.end.split('T')[0] : undefined,
        timeZone: 'UTC'
      };
    }

    if (eventData.location !== undefined) {
      googleEventData.location = eventData.location;
    }

    if (eventData.attendees !== undefined) {
      googleEventData.attendees = eventData.attendees.map(email => ({ email }));
    }

    try {
      const event = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: googleEventData,
        sendUpdates: 'all'
      });

      logger.info('Calendar event updated in Google Calendar', {
        eventId,
        title: eventData.title
      });

      return event.data;
    } catch (error) {
      logger.error('Failed to update event in Google Calendar', {
        error: error instanceof Error ? error.message : String(error),
        eventId
      });
      throw error;
    }
  }

  /**
   * Delete a calendar event from Google Calendar
   */
  async deleteEvent(eventId: string): Promise<void> {
    const calendar = await this.getCalendar();

    try {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all'
      });

      logger.info('Calendar event deleted from Google Calendar', {
        eventId
      });
    } catch (error) {
      logger.error('Failed to delete event from Google Calendar', {
        error: error instanceof Error ? error.message : String(error),
        eventId
      });
      throw error;
    }
  }

  /**
   * Get a specific calendar event from Google Calendar
   */
  async getEvent(eventId: string): Promise<any> {
    const calendar = await this.getCalendar();

    try {
      const event = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId
      });

      return event.data;
    } catch (error) {
      logger.error('Failed to get event from Google Calendar', {
        error: error instanceof Error ? error.message : String(error),
        eventId
      });
      throw error;
    }
  }
}
