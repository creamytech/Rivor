import { google } from 'googleapis';
import { prisma } from './db';
import { decryptForOrg, encryptForOrg } from './crypto';
import { indexThread } from './indexer';
import { logger } from '@/lib/logger';

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{ body?: { data?: string } }>;
  };
  internalDate: string;
}

export class GmailService {
  private oauth2Client: any;

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

  static async createFromAccount(orgId: string, emailAccountId: string): Promise<GmailService> {
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
        provider: 'google',
        userId: emailAccount.org.name // org.name is the user's email
      },
    });

    if (!oauthAccount) {
      throw new Error(`OAuth account for Google not found for user ${emailAccount.org.name}`);
    }

    // Decrypt tokens
    const accessTokenBytes = await decryptForOrg(orgId, oauthAccount.accessToken, 'oauth:access');
    const accessToken = new TextDecoder().decode(accessTokenBytes);
    
    const refreshToken = oauthAccount.refreshToken.length > 0 
      ? new TextDecoder().decode(await decryptForOrg(orgId, oauthAccount.refreshToken, 'oauth:refresh'))
      : undefined;

    return new GmailService(accessToken, refreshToken);
  }

  async getGmail() {
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async syncMessages(orgId: string, emailAccountId: string, historyId?: string): Promise<void> {
    const gmail = await this.getGmail();
    
    try {
      let pageToken: string | undefined;
      let processedCount = 0;

      do {
        const response = await gmail.users.messages.list({
          userId: 'me',
          maxResults: 100,
          pageToken,
          q: 'in:inbox OR in:sent', // Sync inbox and sent items
        });

        const messages = response.data.messages || [];
        
        for (const message of messages) {
          if (message.id) {
            await this.processMessage(orgId, emailAccountId, message.id);
            processedCount++;
          }
        }

        pageToken = response.data.nextPageToken || undefined;
        
        // Limit to 500 messages per sync to avoid timeouts
        if (processedCount >= 500) break;
        
      } while (pageToken);

      console.log(`Synced ${processedCount} messages for account ${emailAccountId}`);

    } catch (error) {
      console.error('Gmail sync error:', error);
      
      // Update account status if authentication failed
      if ((error as any)?.code === 401) {
        await prisma.emailAccount.update({
          where: { id: emailAccountId },
          data: { status: 'action_needed' }
        });
      }
      
      throw error;
    }
  }

  private async processMessage(orgId: string, emailAccountId: string, messageId: string): Promise<void> {
    const gmail = await this.getGmail();
    
    try {
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data as GmailMessage;
      if (!message) return;

      // Check if message already exists
      const existing = await prisma.emailMessage.findFirst({
        where: { messageId: message.id, orgId }
      });

      if (existing) return; // Already synced

      // Extract headers
      const headers = message.payload.headers || [];
      const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      
      const subject = getHeader('Subject');
      const from = getHeader('From');
      const to = getHeader('To');
      const date = getHeader('Date');
      const messageIdHeader = getHeader('Message-ID');

      // Extract body
      let body = '';
      if (message.payload.body?.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      } else if (message.payload.parts) {
        // Handle multipart messages
        for (const part of message.payload.parts) {
          if (part.body?.data) {
            body += Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
        }
      }

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
          sentAt: new Date(message.internalDate ? parseInt(message.internalDate) : Date.now()),
        }
      });

      // Update thread indexing
      await indexThread(thread.id);

    } catch (error) {
      console.error(`Error processing message ${messageId}:`, error);
    }
  }

  async watchMailbox(orgId: string, emailAccountId: string): Promise<void> {
    const gmail = await this.getGmail();
    
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

      logger.info('Setting up Gmail watch', {
        orgId,
        emailAccountId,
        topicName,
        action: 'gmail_watch_setup'
      });

      // Set up Gmail push notifications
      const response = await gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName,
          labelIds: ['INBOX', 'SENT'],
        }
      });

      // Store watch metadata
      const updateData: any = {};
      
      if (response.data.historyId) {
        updateData.historyId = response.data.historyId;
      }
      
      if (response.data.expiration) {
        // Gmail watch expires in ~7 days, convert to timestamp
        updateData.watchExpiration = new Date(parseInt(response.data.expiration));
      }
      
      if (Object.keys(updateData).length > 0) {
        await prisma.emailAccount.update({
          where: { id: emailAccountId },
          data: updateData
        });
      }

      logger.info('Gmail watch setup successful', {
        orgId,
        emailAccountId,
        expiration: response.data.expiration || undefined,
        historyId: response.data.historyId || undefined,
        action: 'gmail_watch_success'
      });
      
    } catch (error: any) {
      logger.error('Gmail watch setup failed', {
        orgId,
        emailAccountId,
        error: error.message,
        action: 'gmail_watch_failed'
      });
      
      // Update account status on failure
      await prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: { status: 'action_needed' }
      });
      
      throw error;
    }
  }

  async handlePushNotification(orgId: string, emailAccountId: string, historyId: string): Promise<void> {
    const gmail = await this.getGmail();
    
    try {
      const emailAccount = await prisma.emailAccount.findUnique({
        where: { id: emailAccountId }
      });

      if (!emailAccount?.historyId) {
        // Full sync if no history
        await this.syncMessages(orgId, emailAccountId);
        return;
      }

      // Incremental sync using history
      const response = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: emailAccount.historyId,
        historyTypes: ['messageAdded', 'messageDeleted'],
      });

      const history = response.data.history || [];
      
      for (const historyItem of history) {
        // Process added messages
        if (historyItem.messagesAdded) {
          for (const added of historyItem.messagesAdded) {
            if (added.message?.id) {
              await this.processMessage(orgId, emailAccountId, added.message.id);
            }
          }
        }

        // Handle deleted messages
        if (historyItem.messagesDeleted) {
          for (const deleted of historyItem.messagesDeleted) {
            if (deleted.message?.id) {
              // For now, we'll log deleted messages but not update the database
              // since the schema doesn't have an isDeleted field
              console.log(`Message deleted: ${deleted.message.id}`);
            }
          }
        }
      }

      // Update stored historyId
      await prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: { historyId }
      });

    } catch (error) {
      console.error('Gmail push notification error:', error);
      throw error;
    }
  }
}
