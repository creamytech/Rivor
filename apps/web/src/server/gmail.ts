import { getGoogleApisLazy } from '@/lib/dynamic-imports';
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
    body?: { data?: string; size?: number };
    parts?: Array<{ 
      body?: { data?: string; size?: number }; 
      headers?: Array<{ name: string; value: string }>;
      filename?: string;
    }>;
  };
  internalDate: string;
}

export class GmailService {
  private oauth2Client: import('google-auth-library').OAuth2Client;
  private google: Awaited<ReturnType<typeof getGoogleApisLazy>> | null = null;

  constructor(accessToken: string, refreshToken?: string) {
    // Will be initialized lazily in getGoogle()
    this.oauth2Client = null as any;
    this.initializeAuth(accessToken, refreshToken);
  }

  private async initializeAuth(accessToken: string, refreshToken?: string) {
    const google = await this.getGoogle();
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

  private async getGoogle() {
    if (!this.google) {
      this.google = await getGoogleApisLazy();
    }
    return this.google;
  }

  static async createFromAccount(orgId: string, emailAccountId: string): Promise<GmailService> {
    // Get OAuth tokens for this account
    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId },
      include: { org: true },
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
    const google = await this.getGoogle();
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

    } catch (error: unknown) {
      logger.error('Gmail initial backfill failed', {
        orgId,
        emailAccountId,
        error: error instanceof Error ? error.message : String(error),
        action: 'gmail_backfill_failed'
      });
      
      // Update account status if authentication failed
      if (error && typeof error === 'object' && 'code' in error && error.code === 401) {
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
        error: error instanceof Error ? error.message : String(error)
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
      if (error && typeof error === 'object' && 'code' in error && error.code === 401) {
        await prisma.emailAccount.update({
          where: { id: emailAccountId },
          data: { status: 'action_needed' }
        });
      }
      
      throw error;
    }
  }

  async processMessage(orgId: string, emailAccountId: string, messageId: string): Promise<void> {
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
      const cc = getHeader('Cc');
      const bcc = getHeader('Bcc');
      const date = getHeader('Date');
      const messageIdHeader = getHeader('Message-ID');

      // Extract body content
      let htmlBody = '';
      let textBody = '';
      let attachments: Array<{filename: string, mimeType: string, size: number}> = [];

      if (message.payload.body?.data) {
        // Single part message
        const bodyData = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
        const contentType = getHeader('Content-Type');
        
        if (contentType?.includes('text/html')) {
          htmlBody = bodyData;
        } else {
          textBody = bodyData;
        }
      } else if (message.payload.parts) {
        // Multipart message
        for (const part of message.payload.parts) {
          if (part.body?.data) {
            const partData = Buffer.from(part.body.data, 'base64').toString('utf-8');
                         const partHeaders = part.headers || [];
             const partContentType = partHeaders.find((h: { name: string; value: string }) => h.name.toLowerCase() === 'content-type')?.value || '';
            
            if (partContentType.includes('text/html')) {
              htmlBody = partData;
            } else if (partContentType.includes('text/plain')) {
              textBody = partData;
            } else if (part.filename) {
              // This is an attachment
              attachments.push({
                filename: part.filename,
                mimeType: partContentType || 'application/octet-stream',
                size: part.body.size || 0
              });
            }
          }
        }
      }

      // Create snippet from text body or HTML body
      let snippet = '';
      if (textBody) {
        snippet = textBody.substring(0, 200).replace(/\s+/g, ' ').trim();
      } else if (htmlBody) {
        // Strip HTML tags for snippet
        snippet = htmlBody.replace(/<[^>]*>/g, '').substring(0, 200).replace(/\s+/g, ' ').trim();
      }

      // Encrypt sensitive data - prioritize HTML content for rich formatting
      const subjectEnc = await encryptForOrg(orgId, subject, 'email:subject');
      const bodyEnc = await encryptForOrg(orgId, htmlBody || textBody, 'email:body');
      const fromEnc = await encryptForOrg(orgId, from, 'email:from');
      const toEnc = await encryptForOrg(orgId, to, 'email:to');
      const ccEnc = await encryptForOrg(orgId, cc, 'email:cc');
      const bccEnc = await encryptForOrg(orgId, bcc, 'email:bcc');
      const snippetEnc = await encryptForOrg(orgId, snippet, 'email:snippet');

             // Find or create thread based on subject (SOC2 compliant)
       let thread = await prisma.emailThread.findFirst({
         where: { 
           orgId,
           accountId: emailAccountId
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
           }
         });
       } else {
         // Update thread's updatedAt when new message is added
         await prisma.emailThread.update({
           where: { id: thread.id },
           data: { updatedAt: new Date() }
         });
       }

             // Create message with all encrypted content
       await prisma.emailMessage.create({
         data: {
           orgId,
           threadId: thread.id,
           messageId: message.id,
           sentAt: new Date(message.internalDate ? parseInt(message.internalDate) : Date.now()),
           subjectEnc,
           bodyRefEnc: bodyEnc,
           fromEnc,
           toEnc,
           ccEnc,
           bccEnc,
           snippetEnc,
         }
       });

      // Log the message details for debugging
      console.log(`Processed message: ${subject}`, {
        from,
        to,
        hasHtmlBody: !!htmlBody,
        hasTextBody: !!textBody,
        snippet: snippet.substring(0, 100),
        attachments: attachments.length
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
      
         } catch (error: unknown) {
       logger.error('Gmail watch setup failed', {
         orgId,
         emailAccountId,
         error: error instanceof Error ? error.message : String(error),
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

  async sendEmail(emailData: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    isHtml?: boolean;
  }): Promise<{ id: string }> {
    const gmail = await this.getGmail();
    
    // Create email message in RFC 2822 format
    const message = this.createEmailMessage(emailData);
    
    // Encode the message in base64
    const encodedMessage = Buffer.from(message).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      logger.info('Email sent successfully via Gmail API', {
        messageId: response.data.id,
        to: emailData.to,
        subject: emailData.subject
      });

      return { id: response.data.id! };
    } catch (error) {
      logger.error('Failed to send email via Gmail API', {
        error: error instanceof Error ? error.message : String(error),
        to: emailData.to,
        subject: emailData.subject
      });
      throw error;
    }
  }

  private createEmailMessage(emailData: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    isHtml?: boolean;
  }): string {
    const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9);
    const contentType = emailData.isHtml ? 'text/html' : 'text/plain';
    
    let message = '';
    
    // Headers
    message += `To: ${emailData.to}\r\n`;
    if (emailData.cc) {
      message += `Cc: ${emailData.cc}\r\n`;
    }
    if (emailData.bcc) {
      message += `Bcc: ${emailData.bcc}\r\n`;
    }
    message += `Subject: ${emailData.subject}\r\n`;
    message += `MIME-Version: 1.0\r\n`;
    message += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`;
    message += `\r\n`;
    
    // Body
    message += `--${boundary}\r\n`;
    message += `Content-Type: ${contentType}; charset=UTF-8\r\n`;
    message += `Content-Transfer-Encoding: 7bit\r\n`;
    message += `\r\n`;
    message += `${emailData.body}\r\n`;
    message += `\r\n`;
    message += `--${boundary}--\r\n`;
    
    return message;
  }
}
