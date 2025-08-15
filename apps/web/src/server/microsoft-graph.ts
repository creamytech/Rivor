import { Client } from '@microsoft/microsoft-graph-client';
import { prisma } from './db';
import { decryptForOrg, encryptForOrg } from './crypto';
import { indexThread } from './indexer';

export interface OutlookMessage {
  id: string;
  conversationId: string;
  subject: string;
  body: {
    content: string;
    contentType: string;
  };
  from: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
  }>;
  receivedDateTime: string;
  isRead: boolean;
}

export class MicrosoftGraphService {
  private client: Client;

  constructor(accessToken: string) {
    this.client = Client.init({
      authProvider: async () => accessToken
    });
  }

  static async createFromAccount(orgId: string, emailAccountId: string): Promise<MicrosoftGraphService> {
    // Get OAuth tokens for this account
    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId },
      include: { org: true }
    });

    if (!emailAccount) {
      throw new Error(`Email account ${emailAccountId} not found`);
    }

    // Find OAuth account using org name (which is the user's email)
    const oauthAccount = await prisma.oAuthAccount.findFirst({
      where: { 
        provider: 'azure-ad',
        userId: emailAccount.org.name // org.name is the user's email
      },
    });

    if (!oauthAccount) {
      throw new Error(`OAuth account for Microsoft not found for user ${emailAccount.org.name}`);
    }

    // Decrypt access token
    const accessTokenBytes = await decryptForOrg(orgId, oauthAccount.accessToken, 'oauth:access');
    const accessToken = new TextDecoder().decode(accessTokenBytes);

    return new MicrosoftGraphService(accessToken);
  }

  async syncMessages(orgId: string, emailAccountId: string, deltaToken?: string): Promise<void> {
    try {
      let url = '/me/messages';
      if (deltaToken) {
        url = `/me/messages/delta?$deltatoken=${deltaToken}`;
      } else {
        url = '/me/messages/delta?$select=id,conversationId,subject,body,from,toRecipients,receivedDateTime,isRead&$top=100';
      }

      let processedCount = 0;
      let nextLink: string | undefined = url;

      do {
        const response = await this.client.api(nextLink).get();
        const messages = response.value || [];

        for (const message of messages) {
          await this.processMessage(orgId, emailAccountId, message);
          processedCount++;
        }

        // Handle pagination
        nextLink = response['@odata.nextLink'];
        
        // Store delta token for next sync
        if (response['@odata.deltaLink']) {
          const deltaUrl = new URL(response['@odata.deltaLink']);
          const newDeltaToken = deltaUrl.searchParams.get('$deltatoken');
          
          if (newDeltaToken) {
            await prisma.emailAccount.update({
              where: { id: emailAccountId },
              data: { historyId: newDeltaToken }
            });
          }
        }

        // Limit to 500 messages per sync
        if (processedCount >= 500) break;

      } while (nextLink);

      console.log(`Synced ${processedCount} Outlook messages for account ${emailAccountId}`);

    } catch (error) {
      console.error('Microsoft Graph sync error:', error);
      
      // Update account status if authentication failed
      if ((error as unknown)?.code === 401 || (error as unknown)?.status === 401) {
        await prisma.emailAccount.update({
          where: { id: emailAccountId },
          data: { status: 'action_needed' }
        });
      }
      
      throw error;
    }
  }

  private async processMessage(orgId: string, emailAccountId: string, message: OutlookMessage): Promise<void> {
    try {
      // Check if message already exists
      const existing = await prisma.emailMessage.findFirst({
        where: { messageId: message.id, orgId }
      });

      if (existing) return; // Already synced

      const subject = message.subject || '';
      const body = message.body?.content || '';
      const from = `${message.from?.emailAddress?.name || ''} <${message.from?.emailAddress?.address || ''}>`;
      const to = message.toRecipients?.map(r => 
        `${r.emailAddress?.name || ''} <${r.emailAddress?.address || ''}>`
      ).join(', ') || '';

      // Encrypt sensitive data
      const subjectEnc = await encryptForOrg(orgId, subject, 'email:subject');
      const bodyEnc = await encryptForOrg(orgId, body, 'email:body');
      const fromEnc = await encryptForOrg(orgId, from, 'email:from');
      const toEnc = await encryptForOrg(orgId, to, 'email:to');

      // Find or create thread based on subject
      let thread = await prisma.emailThread.findFirst({
        where: { 
          orgId,
          accountId: emailAccountId,
          subjectIndex: { contains: subject.toLowerCase() }
        }
      });

      if (!thread) {
        const participantsEnc = await encryptForOrg(orgId, `${from}, ${to}`, 'email:participants');
        
        thread = await prisma.emailThread.create({
          data: {
            orgId,
            accountId: emailAccountId,
            subjectEnc,
            participantsEnc,
            subjectIndex: subject.toLowerCase(),
            participantsIndex: `${from} ${to}`.toLowerCase(),
          }
        });
      }

      // Create message
      await prisma.emailMessage.create({
        data: {
          orgId,
          threadId: thread.id,
          messageId: message.id,
          subjectEnc,
          bodyRefEnc: bodyEnc,
          fromEnc,
          toEnc,
          sentAt: new Date(message.receivedDateTime),
        }
      });

      // Update thread indexing
      await indexThread(thread.id);

    } catch (error) {
      console.error(`Error processing Outlook message ${message.id}:`, error);
    }
  }

  async createSubscription(orgId: string, emailAccountId: string): Promise<void> {
    try {
      const webhookUrl = `${process.env.NEXTAUTH_URL}/api/microsoft/push`;
      
      const subscription = {
        changeType: 'created,updated',
        notificationUrl: webhookUrl,
        resource: '/me/messages',
        expirationDateTime: new Date(Date.now() + 4230 * 60 * 1000).toISOString(), // ~3 days
        clientState: emailAccountId, // Include account ID for routing
      };

      const response = await this.client.api('/subscriptions').post(subscription);
      
      console.log(`Microsoft Graph subscription created for account ${emailAccountId}:`, response.id);

    } catch (error) {
      console.error('Microsoft Graph subscription error:', error);
      throw error;
    }
  }

  async handleWebhook(orgId: string, emailAccountId: string, notification: unknown): Promise<void> {
    try {
      // Get the resource URL from the notification
      const resourceUrl = notification.resource;
      
      if (resourceUrl && resourceUrl.includes('/messages/')) {
        // Extract message ID from resource URL
        const messageId = resourceUrl.split('/messages/')[1];
        
        if (messageId) {
          // Fetch the specific message
          const message = await this.client.api(`/me/messages/${messageId}`).get();
          await this.processMessage(orgId, emailAccountId, message);
        }
      }

    } catch (error) {
      console.error('Microsoft Graph webhook error:', error);
      throw error;
    }
  }

  async syncCalendar(orgId: string, emailAccountId: string): Promise<void> {
    try {
      const response = await this.client
        .api('/me/events')
        .select('id,subject,start,end,location,attendees,body')
        .top(100)
        .get();

      const events = response.value || [];
      let processedCount = 0;

      for (const event of events) {
        // Encrypt sensitive data
        const titleEnc = await encryptForOrg(orgId, event.subject || '', 'calendar:title');
        const locationEnc = await encryptForOrg(orgId, event.location?.displayName || '', 'calendar:location');
        const notesEnc = await encryptForOrg(orgId, event.body?.content || '', 'calendar:notes');

        // Create calendar event (for now, we don't check for duplicates)
        await prisma.calendarEvent.create({
          data: {
            orgId,
            accountId: emailAccountId,
            titleEnc,
            locationEnc,
            notesEnc,
            start: new Date(event.start.dateTime),
            end: new Date(event.end.dateTime),
          }
        });

        processedCount++;
      }

      console.log(`Synced ${processedCount} calendar events for account ${emailAccountId}`);

    } catch (error) {
      console.error('Microsoft Graph calendar sync error:', error);
      throw error;
    }
  }
}
