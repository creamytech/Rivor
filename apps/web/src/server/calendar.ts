import { google } from 'googleapis';
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
    // Get OAuth tokens for this account
    const calendarAccount = await prisma.calendarAccount.findUnique({
      where: { id: calendarAccountId },
      include: { org: true },
    });

    if (!calendarAccount) {
      throw new Error(`Calendar account ${calendarAccountId} not found`);
    }

    // Get all secure tokens for this account
    const secureTokens = await prisma.secureToken.findMany({
      where: {
        orgId,
        provider: 'google',
        encryptionStatus: 'ok'
      }
    });

    if (secureTokens.length === 0) {
      throw new Error(`No encrypted tokens found for Google calendar account ${calendarAccountId}`);
    }

    // Decrypt access token
    const accessTokenRecord = secureTokens.find(t => t.tokenType === 'oauth_access');
    if (!accessTokenRecord?.encryptedTokenBlob) {
      throw new Error(`Access token not found for Google calendar account ${calendarAccountId}`);
    }

    // Get the external account ID from the token reference
    const tokenRefParts = accessTokenRecord.tokenRef.split('-');
    const externalAccountId = tokenRefParts[tokenRefParts.length - 2]; // Second to last part

    const accessTokenBytes = await decryptForOrg(
      orgId, 
      accessTokenRecord.encryptedTokenBlob, 
      `oauth:access:${externalAccountId}`
    );
    const accessToken = new TextDecoder().decode(accessTokenBytes);
    
    // Decrypt refresh token if available
    let refreshToken: string | undefined;
    const refreshTokenRecord = secureTokens.find(t => t.tokenType === 'oauth_refresh');
    if (refreshTokenRecord?.encryptedTokenBlob) {
      const refreshTokenBytes = await decryptForOrg(
        orgId, 
        refreshTokenRecord.encryptedTokenBlob, 
        `oauth:refresh:${externalAccountId}`
      );
      refreshToken = new TextDecoder().decode(refreshTokenBytes);
    }

    return new GoogleCalendarService(accessToken, refreshToken);
  }

  async getCalendar() {
    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }
}
