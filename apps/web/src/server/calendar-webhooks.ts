import { google } from 'googleapis';
import { prisma } from './db';
import { createGoogleOAuthClient } from './token-validation';
import { logger } from '@/lib/logger';
import { enqueueWebhookRenewal } from './queue';

export interface CalendarChannelSetup {
  channelId: string;
  resourceId: string;
  expiration: Date;
  webhookEndpoint: string;
}

export class CalendarWebhookService {
  private orgId: string;
  private oauthClient: any;

  constructor(orgId: string, oauthClient: any) {
    this.orgId = orgId;
    this.oauthClient = oauthClient;
  }

  static async createFromOrg(orgId: string): Promise<CalendarWebhookService> {
    // Find Google OAuth account for this org
    const org = await prisma.org.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new Error('Organization not found');
    }

    const oauthAccount = await prisma.oAuthAccount.findFirst({
      where: {
        provider: 'google',
        userId: org.name // org.name is the user's email
      }
    });

    if (!oauthAccount) {
      throw new Error('No Google OAuth account found');
    }

    // Create OAuth client with automatic token refresh
    const oauthClient = await createGoogleOAuthClient(orgId, oauthAccount.id);
    
    return new CalendarWebhookService(orgId, oauthClient);
  }

  /**
   * Set up Calendar watch channel for an account
   */
  async setupWatch(calendarAccountId: string): Promise<CalendarChannelSetup> {
    const correlationId = `calendar-watch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('Setting up Calendar watch channel', {
        orgId: this.orgId,
        calendarAccountId,
        correlationId,
        action: 'calendar_watch_setup'
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauthClient });
      
      // Generate unique channel ID
      const channelId = `rivor-calendar-${calendarAccountId}-${Date.now()}`;
      
      // Determine webhook endpoint
      const webhookEndpoint = `${process.env.NEXTAUTH_URL || process.env.APP_URL}/api/calendar/push`;
      
      // Set up watch for primary calendar events
      const response = await calendar.events.watch({
        calendarId: 'primary',
        requestBody: {
          id: channelId,
          type: 'web_hook',
          address: webhookEndpoint,
          // Optional: filter for specific event types
          params: {
            // ttl: '3600' // Time to live in seconds (optional)
          }
        }
      });

      if (!response.data.id || !response.data.resourceId || !response.data.expiration) {
        throw new Error('Invalid response from Calendar events.watch API');
      }

      const channelSetup: CalendarChannelSetup = {
        channelId: response.data.id,
        resourceId: response.data.resourceId,
        expiration: new Date(parseInt(response.data.expiration)),
        webhookEndpoint
      };

      // Store channel metadata in database
      await prisma.calendarAccount.update({
        where: { id: calendarAccountId },
        data: {
          channelId: channelSetup.channelId,
          channelResourceId: channelSetup.resourceId,
          channelExpiration: channelSetup.expiration,
          webhookEndpoint: channelSetup.webhookEndpoint,
          status: 'connected'
        }
      });

      // Schedule renewal 24 hours before expiration
      const renewalDelay = channelSetup.expiration.getTime() - Date.now() - (24 * 60 * 60 * 1000);
      if (renewalDelay > 0) {
        await enqueueWebhookRenewal('calendar', calendarAccountId, this.orgId, renewalDelay);
      }

      logger.info('Calendar watch channel setup successful', {
        orgId: this.orgId,
        calendarAccountId,
        correlationId,
        channelId: channelSetup.channelId,
        expiration: channelSetup.expiration,
        action: 'calendar_watch_success'
      });

      return channelSetup;
    } catch (error: any) {
      logger.error('Calendar watch channel setup failed', {
        orgId: this.orgId,
        calendarAccountId,
        correlationId,
        error: error.message,
        action: 'calendar_watch_failed'
      });

      // Update account status on failure
      await prisma.calendarAccount.update({
        where: { id: calendarAccountId },
        data: { status: 'watch_failed' }
      });

      throw error;
    }
  }

  /**
   * Renew an existing Calendar watch channel
   */
  async renewWatch(calendarAccountId: string): Promise<CalendarChannelSetup> {
    const correlationId = `calendar-renew-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('Renewing Calendar watch channel', {
        orgId: this.orgId,
        calendarAccountId,
        correlationId,
        action: 'calendar_watch_renew'
      });

      const calendarAccount = await prisma.calendarAccount.findUnique({
        where: { id: calendarAccountId }
      });

      if (!calendarAccount) {
        throw new Error(`Calendar account ${calendarAccountId} not found`);
      }

      // Stop existing channel if it exists
      if (calendarAccount.channelId && calendarAccount.channelResourceId) {
        try {
          await this.stopWatch(calendarAccount.channelId, calendarAccount.channelResourceId);
        } catch (stopError) {
          logger.warn('Failed to stop existing calendar channel during renewal', {
            orgId: this.orgId,
            calendarAccountId,
            correlationId,
            channelId: calendarAccount.channelId,
            error: stopError instanceof Error ? stopError.message : 'Unknown error',
            action: 'calendar_watch_stop_failed'
          });
        }
      }

      // Create new watch channel
      const newChannelSetup = await this.setupWatch(calendarAccountId);

      logger.info('Calendar watch channel renewed successfully', {
        orgId: this.orgId,
        calendarAccountId,
        correlationId,
        oldChannelId: calendarAccount.channelId,
        newChannelId: newChannelSetup.channelId,
        action: 'calendar_watch_renewed'
      });

      return newChannelSetup;
    } catch (error: any) {
      logger.error('Calendar watch channel renewal failed', {
        orgId: this.orgId,
        calendarAccountId,
        correlationId,
        error: error.message,
        action: 'calendar_watch_renew_failed'
      });

      // Update account status on renewal failure
      await prisma.calendarAccount.update({
        where: { id: calendarAccountId },
        data: { status: 'watch_renewal_failed' }
      });

      throw error;
    }
  }

  /**
   * Stop a Calendar watch channel
   */
  async stopWatch(channelId: string, resourceId: string): Promise<void> {
    const correlationId = `calendar-stop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('Stopping Calendar watch channel', {
        orgId: this.orgId,
        channelId,
        resourceId,
        correlationId,
        action: 'calendar_watch_stop'
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauthClient });
      
      await calendar.channels.stop({
        requestBody: {
          id: channelId,
          resourceId: resourceId
        }
      });

      logger.info('Calendar watch channel stopped successfully', {
        orgId: this.orgId,
        channelId,
        resourceId,
        correlationId,
        action: 'calendar_watch_stopped'
      });
    } catch (error: any) {
      logger.error('Calendar watch channel stop failed', {
        orgId: this.orgId,
        channelId,
        resourceId,
        correlationId,
        error: error.message,
        action: 'calendar_watch_stop_failed'
      });
      throw error;
    }
  }

  /**
   * Validate incoming Calendar webhook notification
   */
  static validateNotification(headers: Headers): {
    valid: boolean;
    channelId?: string;
    resourceId?: string;
    state?: string;
    error?: string;
  } {
    try {
      const channelId = headers.get('x-goog-channel-id');
      const resourceId = headers.get('x-goog-resource-id');
      const state = headers.get('x-goog-resource-state');
      const channelToken = headers.get('x-goog-channel-token');

      if (!channelId || !resourceId) {
        return {
          valid: false,
          error: 'Missing required headers: x-goog-channel-id or x-goog-resource-id'
        };
      }

      // Optional: Validate channel token if configured
      const expectedToken = process.env.GOOGLE_CALENDAR_WEBHOOK_TOKEN;
      if (expectedToken && channelToken !== expectedToken) {
        return {
          valid: false,
          error: 'Invalid channel token'
        };
      }

      return {
        valid: true,
        channelId: channelId || undefined,
        resourceId: resourceId || undefined,
        state: state || undefined
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * Get all active calendar channels that need renewal soon
   */
  static async getChannelsNeedingRenewal(hoursFromNow = 24): Promise<Array<{
    id: string;
    orgId: string;
    channelId: string;
    expiration: Date;
  }>> {
    const renewalThreshold = new Date();
    renewalThreshold.setHours(renewalThreshold.getHours() + hoursFromNow);

    const accounts = await prisma.calendarAccount.findMany({
      where: {
        channelId: { not: null },
        channelExpiration: {
          lte: renewalThreshold,
          gt: new Date() // Not yet expired
        },
        status: { not: 'watch_renewal_failed' }
      },
      select: {
        id: true,
        orgId: true,
        channelId: true,
        channelExpiration: true
      }
    });

    return accounts.map(account => ({
      id: account.id,
      orgId: account.orgId,
      channelId: account.channelId!,
      expiration: account.channelExpiration!
    }));
  }
}
