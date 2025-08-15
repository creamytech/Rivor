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

    if (!emailAccount.tokenRef) {
      throw new Error(`No token reference found for email account ${emailAccountId}`);
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
      throw new Error(`No encrypted tokens found for Google account ${emailAccountId}`);
    }

    // Decrypt access token
    const accessTokenRecord = secureTokens.find(t => t.tokenType === 'oauth_access');
    if (!accessTokenRecord?.encryptedTokenBlob) {
      throw new Error(`Access token not found for Google account ${emailAccountId}`);
    }

    const accessTokenBytes = await decryptForOrg(
      orgId, 
      accessTokenRecord.encryptedTokenBlob, 
      `oauth:access:${emailAccount.externalAccountId}`
    );
    const accessToken = new TextDecoder().decode(accessTokenBytes);
    
    // Decrypt refresh token if available
    let refreshToken: string | undefined;
    const refreshTokenRecord = secureTokens.find(t => t.tokenType === 'oauth_refresh');
    if (refreshTokenRecord?.encryptedTokenBlob) {
      const refreshTokenBytes = await decryptForOrg(
        orgId, 
        refreshTokenRecord.encryptedTokenBlob, 
        `oauth:refresh:${emailAccount.externalAccountId}`
      );
      refreshToken = new TextDecoder().decode(refreshTokenBytes);
    }

    return new GmailService(accessToken, refreshToken);
  }

  async getGmail() {
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async performInitialBackfill(orgId: string, emailAccountId: string, cutoffDate: Date): Promise<void> {
    const gmail = await this.getGmail();
    
    try {
      let pageToken: string | undefined;
      let processedCount = 0;
      let totalThreads = 0;

      logger.info('Starting Gmail initial backfill', {
        orgId,
        emailAccountId,
        cutoffDate: cutoffDate.toISOString(),
        action: 'gmail_backfill_start'
      });

      // First, sync threads from the specified date range
      do {
        const response = await gmail.users.threads.list({
          userId: 'me',
          maxResults: 50,
          pageToken,
          q: `after:${Math.floor(cutoffDate.getTime() / 1000)}`, // Gmail query for date filter
        });

        const threads = response.data.threads || [];
        totalThreads += threads.length;
        
        for (const thread of threads) {
          if (thread.id) {
            await this.processThread(orgId, emailAccountId, thread.id);
            processedCount++;

            // Log progress every 10 threads
            if (processedCount % 10 === 0) {
              logger.info('Gmail backfill progress', {
                orgId,
                emailAccountId,
                processedThreads: processedCount,
                action: 'gmail_backfill_progress'
              });
            }
          }
        }

        pageToken = response.data.nextPageToken || undefined;
        
        // Limit to prevent overwhelming the system
        if (processedCount >= 500) break;
        
      } while (pageToken);

      logger.info('Gmail initial backfill completed', {
        orgId,
        emailAccountId,
        totalThreads,
        processedCount,
        action: 'gmail_backfill_complete'
      });

    } catch (error: any) {
      logger.error('Gmail initial backfill failed', {
        orgId,
        emailAccountId,
        error: error.message,
        action: 'gmail_backfill_failed'
      });
      
      // Update account status if authentication failed
      if (error?.code === 401) {
        await prisma.emailAccount.update({
          where: { id: emailAccountId },
          data: { status: 'action_needed' }
        });
      }
      
      throw error;
    }
  }

  private async processThread(orgId: string, emailAccountId: string, threadId: string): Promise<void> {
    const gmail = await this.getGmail();
    
    try {
      const response = await gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full',
      });

      const thread = response.data;
      if (!thread?.messages) return;

      // Process each message in the thread
      for (const message of thread.messages) {
        if (message.id) {
          await this.processMessage(orgId, emailAccountId, message.id);
        }
      }

    } catch (error) {
      logger.warn(`Error processing thread ${threadId}`, {
        orgId,
        emailAccountId,
        threadId,
        error: (error as any)?.message || error
      });
    }
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
          labelIds: ['INBOX', 'SENT'], // Watch both inbox and sent items
          labelFilterAction: 'include'
        }
      });

      // Store watch metadata - this is crucial for push notifications
      const updateData: any = {
        status: 'connected' // Ensure account is marked as fully connected
      };
      
      if (response.data.historyId) {
        updateData.historyId = response.data.historyId;
        logger.info('Gmail watch history ID stored', {
          orgId,
          emailAccountId,
          historyId: response.data.historyId,
          action: 'gmail_watch_history_stored'
        });
      }
      
      if (response.data.expiration) {
        // Gmail watch expires in ~7 days, convert to timestamp
        updateData.watchExpiration = new Date(parseInt(response.data.expiration));
        logger.info('Gmail watch expiration set', {
          orgId,
          emailAccountId,
          expiration: updateData.watchExpiration.toISOString(),
          action: 'gmail_watch_expiration_set'
        });
      }
      
      await prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: updateData
      });

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
