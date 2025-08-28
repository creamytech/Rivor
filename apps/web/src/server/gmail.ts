import { getGoogleApisLazy } from '@/lib/dynamic-imports';
import { prisma } from './db';
import { decryptForOrg, encryptForOrg } from './crypto';
import { indexThread } from './indexer';
import { linkEmailToPipelineContacts } from './pipeline-email-service';
import { emailWorkflowService } from './email-workflow';
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

  constructor(
    accessToken: string, 
    refreshToken?: string,
    private orgId?: string,
    private emailAccountId?: string
  ) {
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

  private async refreshTokenIfNeeded(): Promise<void> {
    if (!this.oauth2Client || !this.orgId || !this.emailAccountId) {
      return; // Can't refresh without proper context
    }

    try {
      // Check if token is expired by making a test call
      const credentials = this.oauth2Client.credentials;
      if (!credentials.expiry_date || Date.now() < credentials.expiry_date) {
        return; // Token is still valid
      }

      logger.info('Refreshing expired OAuth token', {
        orgId: this.orgId,
        emailAccountId: this.emailAccountId
      });

      // Refresh the token
      const { credentials: newCredentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(newCredentials);

      // If we got a new access token, save it to the database
      if (newCredentials.access_token && this.orgId && this.emailAccountId) {
        const { encryptForOrg } = await import('@/server/secure-tokens');
        
        // Encrypt and save new access token
        const encryptedAccessToken = await encryptForOrg(
          this.orgId,
          new TextEncoder().encode(newCredentials.access_token),
          `oauth:google:access`
        );

        // Update the Account record with new token
        const emailAccount = await prisma.emailAccount.findUnique({
          where: { id: this.emailAccountId },
          include: { user: { include: { accounts: true } } }
        });

        if (emailAccount) {
          const googleAccount = emailAccount.user.accounts.find(acc => 
            acc.provider === 'google' && 
            acc.providerAccountId === emailAccount.externalAccountId
          );

          if (googleAccount) {
            await prisma.account.update({
              where: { id: googleAccount.id },
              data: {
                access_token_enc: encryptedAccessToken,
                expires_at: newCredentials.expiry_date ? Math.floor(newCredentials.expiry_date / 1000) : null,
              }
            });

            // Update email account status
            await prisma.emailAccount.update({
              where: { id: this.emailAccountId },
              data: { 
                status: 'connected',
                tokenStatus: 'encrypted',
                syncStatus: 'ready' 
              }
            });

            logger.info('Successfully refreshed and saved OAuth token', {
              orgId: this.orgId,
              emailAccountId: this.emailAccountId
            });
          }
        }
      }

    } catch (error) {
      logger.error('Failed to refresh OAuth token', {
        orgId: this.orgId,
        emailAccountId: this.emailAccountId,
        error: error instanceof Error ? error.message : String(error)
      });

      // Mark account as needing reauth
      if (this.emailAccountId) {
        await prisma.emailAccount.update({
          where: { id: this.emailAccountId },
          data: { 
            status: 'action_needed',
            syncStatus: 'error',
            errorReason: 'Token refresh failed - please reconnect account'
          }
        }).catch(() => {}); // Ignore update errors
      }
      
      throw error;
    }
  }

  static async createFromAccount(orgId: string, emailAccountId: string): Promise<GmailService> {
    // Get OAuth tokens for this account from SecureToken via tokenRef
    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId },
      include: { 
        org: {
          include: {
            secureTokens: {
              select: {
                id: true,
                tokenRef: true,
                tokenType: true,
                encryptedTokenBlob: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        },
        user: {
          include: {
            accounts: {
              where: {
                provider: 'google'
              }
            },
            oauthAccounts: {
              where: {
                provider: 'google'
              }
            }
          }
        }
      },
    });

    if (!emailAccount) {
      throw new Error(`Email account ${emailAccountId} not found`);
    }

    let accessToken: string;
    let refreshToken: string | undefined;

    // Try to get tokens from SecureToken first (new encrypted storage)
    if (emailAccount.tokenRef) {
      logger.info('Attempting SecureToken retrieval', {
        emailAccountId,
        tokenRef: emailAccount.tokenRef,
        availableSecureTokens: emailAccount.org.secureTokens.map(t => ({
          tokenRef: t.tokenRef,
          tokenType: t.tokenType,
          hasEncryptedBlob: !!t.encryptedTokenBlob
        }))
      });

      // Find both access and refresh tokens
      const accessTokenSecure = emailAccount.org.secureTokens.find(token => 
        token.tokenRef === emailAccount.tokenRef && token.tokenType === 'oauth_access'
      );
      const refreshTokenSecure = emailAccount.org.secureTokens.find(token => 
        token.tokenRef.startsWith(emailAccount.tokenRef.split('-1756')[0]) && token.tokenType === 'oauth_refresh'
      );
      
      if (accessTokenSecure && accessTokenSecure.encryptedTokenBlob) {
        try {
          const { decryptForOrg } = await import('@/server/secure-tokens');
          
          // Decrypt access token
          const accessTokenBytes = await decryptForOrg(
            orgId, 
            accessTokenSecure.encryptedTokenBlob, 
            `oauth:google:access`
          );
          accessToken = new TextDecoder().decode(accessTokenBytes);

          // Decrypt refresh token if available
          if (refreshTokenSecure && refreshTokenSecure.encryptedTokenBlob) {
            const refreshTokenBytes = await decryptForOrg(
              orgId, 
              refreshTokenSecure.encryptedTokenBlob, 
              `oauth:google:refresh`
            );
            refreshToken = new TextDecoder().decode(refreshTokenBytes);
          }
          
          logger.info('Retrieved tokens from SecureToken storage', {
            emailAccountId,
            tokenRef: emailAccount.tokenRef,
            hasRefreshToken: !!refreshToken
          });
          
          return new GmailService(accessToken, refreshToken, orgId, emailAccountId);
        } catch (secureTokenError) {
          logger.warn('Failed to decrypt from SecureToken, trying fallback', {
            emailAccountId,
            tokenRef: emailAccount.tokenRef,
            error: secureTokenError instanceof Error ? secureTokenError.message : String(secureTokenError)
          });
        }
      } else {
        logger.warn('SecureToken found but missing encrypted blob', {
          emailAccountId,
          tokenRef: emailAccount.tokenRef,
          hasAccessToken: !!accessTokenSecure,
          accessTokenHasBlob: !!(accessTokenSecure && accessTokenSecure.encryptedTokenBlob)
        });
      }
    }

    // Fallback: Try OAuthAccount (encrypted bytes)
    const oauthAccount = emailAccount.user.oauthAccounts.find(acc =>
      acc.provider === 'google' && 
      acc.providerId === emailAccount.externalAccountId
    );

    if (oauthAccount) {
      try {
        const { decryptForOrg } = await import('@/server/secure-tokens');
        
        const accessTokenBytes = await decryptForOrg(
          orgId, 
          oauthAccount.accessToken, 
          `oauth:google:access`
        );
        accessToken = new TextDecoder().decode(accessTokenBytes);

        const refreshTokenBytes = await decryptForOrg(
          orgId, 
          oauthAccount.refreshToken, 
          `oauth:google:refresh`
        );
        refreshToken = new TextDecoder().decode(refreshTokenBytes);
        
        logger.info('Retrieved tokens from OAuthAccount storage', {
          emailAccountId,
          oauthAccountId: oauthAccount.id
        });
        
        return new GmailService(accessToken, refreshToken, orgId, emailAccountId);
      } catch (oauthError) {
        logger.warn('Failed to decrypt from OAuthAccount, trying plain tokens', {
          emailAccountId,
          oauthAccountId: oauthAccount.id,
          error: oauthError instanceof Error ? oauthError.message : String(oauthError)
        });
      }
    }

    // Last fallback: Try plain tokens from Account (NextAuth)
    const googleAccount = emailAccount.user.accounts.find(acc => 
      acc.provider === 'google' && 
      acc.providerAccountId === emailAccount.externalAccountId
    );

    if (googleAccount?.access_token) {
      logger.info('Using plain tokens from Account storage (NextAuth)', {
        emailAccountId,
        accountId: googleAccount.id
      });
      
      return new GmailService(
        googleAccount.access_token, 
        googleAccount.refresh_token || undefined, 
        orgId, 
        emailAccountId
      );
    }

    throw new Error(`No valid OAuth tokens found for email account ${emailAccountId}. Checked SecureToken (tokenRef: ${emailAccount.tokenRef}), OAuthAccount, and Account storage.`);
  }

  async getGmail() {
    await this.refreshTokenIfNeeded();
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

  private async processThread(orgId: string, emailAccountId: string, gmailThreadId: string): Promise<void> {
    const gmail = await this.getGmail();
    
    try {
      const response = await gmail.users.threads.get({
        userId: 'me',
        id: gmailThreadId,
        format: 'full',
      });

      const gmailThread = response.data;
      if (!gmailThread?.messages || gmailThread.messages.length === 0) return;

      // Get the first message to extract thread metadata (subject, participants)
      const firstMessage = gmailThread.messages[0];
      const headers = firstMessage?.payload?.headers || [];
      const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      
      const subject = getHeader('Subject');
      const from = getHeader('From');
      const to = getHeader('To');
      
      // Encrypt thread metadata
      const subjectEnc = await encryptForOrg(orgId, subject, 'email:subject');
      const participantsEnc = await encryptForOrg(orgId, `${from}, ${to}`, 'email:participants');
      
      // Find or create thread using Gmail threadId stored as external reference
      // Since we can't add a gmailThreadId field easily, we'll use subject matching for now
      let thread = await prisma.emailThread.findFirst({
        where: { 
          orgId,
          accountId: emailAccountId,
          subjectEnc: subjectEnc
        }
      });

      if (!thread) {
        thread = await prisma.emailThread.create({
          data: {
            orgId,
            accountId: emailAccountId,
            subjectEnc,
            participantsEnc,
          }
        });
        
        logger.info('Created email thread', {
          orgId,
          emailAccountId,
          threadId: thread.id,
          gmailThreadId,
          subject: subject.substring(0, 50),
          messageCount: gmailThread.messages.length,
          action: 'email_thread_created'
        });
      }

      // Process each message in the thread
      let messagesProcessed = 0;
      for (const message of gmailThread.messages) {
        if (message.id) {
          // Check if message already exists before processing
          const existing = await prisma.emailMessage.findFirst({
            where: { messageId: message.id, orgId }
          });

          if (!existing) {
            await this.processMessageInThread(orgId, emailAccountId, thread.id, message);
            messagesProcessed++;
          }
        }
      }
      
      // Update thread timestamp if we processed new messages
      if (messagesProcessed > 0) {
        await prisma.emailThread.update({
          where: { id: thread.id },
          data: { updatedAt: new Date() }
        });

        // Automatically link this thread to pipeline contacts if any participants match
        try {
          const pipelineLinkResult = await linkEmailToPipelineContacts(orgId, thread.id);
          if (pipelineLinkResult.linked) {
            logger.info('Auto-linked email thread to pipeline', {
              orgId,
              threadId: thread.id,
              gmailThreadId,
              linkedLeads: pipelineLinkResult.matchingLeads,
              action: 'pipeline_auto_link'
            });
          }
        } catch (error) {
          logger.error('Failed to auto-link thread to pipeline', {
            orgId,
            threadId: thread.id,
            gmailThreadId,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'pipeline_auto_link_failed'
          });
        }
      }

    } catch (error) {
      logger.warn(`Error processing Gmail thread ${gmailThreadId}`, {
        orgId,
        emailAccountId,
        gmailThreadId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async processMessageInThread(orgId: string, emailAccountId: string, threadId: string, message: any): Promise<void> {
    try {
      if (!message?.payload?.headers) return;

      // Extract headers
      const headers = message.payload.headers || [];
      const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      
      const subject = getHeader('Subject');
      const from = getHeader('From');
      const to = getHeader('To');
      const cc = getHeader('Cc');
      const bcc = getHeader('Bcc');
      const date = getHeader('Date');

      // Extract body content
      let htmlBody = '';
      let textBody = '';
      const attachments: Array<{filename: string, mimeType: string, size: number}> = [];

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
        snippet = htmlBody.replace(/<[^>]*>/g, '').substring(0, 200).replace(/\s+/g, ' ').trim();
      }

      // Encrypt sensitive data
      const subjectEnc = await encryptForOrg(orgId, subject, 'email:subject');
      
      // Store body content with type information for better display
      const bodyContent = htmlBody 
        ? JSON.stringify({ type: 'html', content: htmlBody })
        : JSON.stringify({ type: 'text', content: textBody });
      const bodyEnc = await encryptForOrg(orgId, bodyContent, 'email:body');
      const fromEnc = await encryptForOrg(orgId, from, 'email:from');
      const toEnc = await encryptForOrg(orgId, to, 'email:to');
      const ccEnc = await encryptForOrg(orgId, cc, 'email:cc');
      const bccEnc = await encryptForOrg(orgId, bcc, 'email:bcc');
      const snippetEnc = await encryptForOrg(orgId, snippet, 'email:snippet');

      // Create message in the provided thread
      await prisma.emailMessage.create({
        data: {
          orgId,
          threadId,
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

    } catch (error) {
      logger.error(`Error processing message ${message.id} in thread`, {
        orgId,
        emailAccountId,
        threadId,
        messageId: message.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async syncMessages(orgId: string, emailAccountId: string, historyId?: string): Promise<void> {
    const gmail = await this.getGmail();
    
    try {
      let pageToken: string | undefined;
      let processedCount = 0;
      let threadsCreated = 0;

      logger.info('Starting Gmail sync', {
        orgId,
        emailAccountId,
        action: 'gmail_sync_start'
      });

      // Use threads API instead of messages for better grouping
      do {
        const response = await gmail.users.threads.list({
          userId: 'me',
          maxResults: 50, // Fewer threads but more comprehensive
          pageToken,
          q: 'in:inbox OR in:sent', // Sync inbox and sent items
        });

        const threads = response.data.threads || [];
        
        for (const thread of threads) {
          if (thread.id) {
            await this.processThread(orgId, emailAccountId, thread.id);
            processedCount++;
            threadsCreated++; // Each thread is a conversation
            
            // Log progress
            if (processedCount % 10 === 0) {
              logger.info('Gmail sync progress', {
                orgId,
                emailAccountId,
                processedThreads: processedCount,
                action: 'gmail_sync_progress'
              });
            }
          }
        }

        pageToken = response.data.nextPageToken || undefined;
        
        // Limit to 100 threads per sync to avoid timeouts
        if (processedCount >= 100) break;
        
      } while (pageToken);

      logger.info('Gmail sync completed', {
        orgId,
        emailAccountId,
        threadsProcessed: processedCount,
        action: 'gmail_sync_complete'
      });

    } catch (error) {
      logger.error('Gmail sync error', {
        orgId,
        emailAccountId,
        error: error instanceof Error ? error.message : String(error),
        action: 'gmail_sync_error'
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
      const attachments: Array<{filename: string, mimeType: string, size: number}> = [];

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
      
      // Store body content with type information for better display
      const bodyContent = htmlBody 
        ? JSON.stringify({ type: 'html', content: htmlBody })
        : JSON.stringify({ type: 'text', content: textBody });
      const bodyEnc = await encryptForOrg(orgId, bodyContent, 'email:body');
      const fromEnc = await encryptForOrg(orgId, from, 'email:from');
      const toEnc = await encryptForOrg(orgId, to, 'email:to');
      const ccEnc = await encryptForOrg(orgId, cc, 'email:cc');
      const bccEnc = await encryptForOrg(orgId, bcc, 'email:bcc');
      const snippetEnc = await encryptForOrg(orgId, snippet, 'email:snippet');

             // Find or create thread using Gmail threadId for proper grouping
       // First check if we have a thread with matching subject
       let thread = await prisma.emailThread.findFirst({
         where: { 
           orgId,
           accountId: emailAccountId,
           subjectEnc: subjectEnc
         }
       });

       // If no exact subject match, try finding by similar subject (Re: FW: etc)
       if (!thread && subject) {
         const cleanSubject = subject.replace(/^(Re:|Fw:|Fwd:)\s*/i, '').trim();
         const cleanSubjectEnc = await encryptForOrg(orgId, cleanSubject, 'email:subject');
         
         thread = await prisma.emailThread.findFirst({
           where: { 
             orgId,
             accountId: emailAccountId,
             subjectEnc: cleanSubjectEnc
           }
         });
       }

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
         
         logger.info('Created new email thread', {
           orgId,
           emailAccountId,
           threadId: thread.id,
           subject: subject.substring(0, 50),
           gmailThreadId: message.threadId,
           action: 'email_thread_created'
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

      // Trigger AI analysis workflow for newly added threads
      try {
        // Get all threads without AI analysis in the last 5 minutes
        const recentThreads = await prisma.emailThread.findMany({
          where: {
            orgId,
            accountId: emailAccountId,
            createdAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes for push notifications
            },
            // Only process threads that don't have AI analysis yet
            aiAnalysis: {
              none: {}
            }
          },
          select: { id: true },
          take: 10 // Process up to 10 threads to avoid overwhelming the system
        });

        if (recentThreads.length > 0) {
          console.log(`[gmail-push] Found ${recentThreads.length} recent threads to analyze`);
          
          // Process threads for AI analysis asynchronously
          for (const thread of recentThreads) {
            try {
              // Don't await here to prevent blocking the webhook response
              emailWorkflowService.processEmailThread(orgId, thread.id).catch(error => {
                console.error(`[gmail-push] Failed to process thread ${thread.id}:`, error);
              });
            } catch (workflowError) {
              console.error(`[gmail-push] Error starting workflow for thread ${thread.id}:`, workflowError);
            }
          }
        }
      } catch (analysisError) {
        console.error(`[gmail-push] Failed to trigger AI analysis:`, analysisError);
      }

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

  /**
   * Mark messages as read in Gmail
   */
  async markAsRead(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;

    const gmail = await this.getGmail();
    
    try {
      // Gmail API allows batch modifications
      for (const messageId of messageIds) {
        await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['UNREAD']
          }
        });
      }
      
      logger.info('Messages marked as read in Gmail', { 
        count: messageIds.length,
        messageIds: messageIds.slice(0, 5) // Log first 5 for debugging
      });
    } catch (error) {
      logger.error('Failed to mark messages as read in Gmail', {
        error: error instanceof Error ? error.message : String(error),
        messageIds: messageIds.slice(0, 3)
      });
      throw error;
    }
  }

  /**
   * Mark messages as unread in Gmail
   */
  async markAsUnread(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;

    const gmail = await this.getGmail();
    
    try {
      for (const messageId of messageIds) {
        await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            addLabelIds: ['UNREAD']
          }
        });
      }
      
      logger.info('Messages marked as unread in Gmail', { 
        count: messageIds.length 
      });
    } catch (error) {
      logger.error('Failed to mark messages as unread in Gmail', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Archive messages in Gmail
   */
  async archiveMessages(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;

    const gmail = await this.getGmail();
    
    try {
      for (const messageId of messageIds) {
        await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['INBOX']
          }
        });
      }
      
      logger.info('Messages archived in Gmail', { 
        count: messageIds.length 
      });
    } catch (error) {
      logger.error('Failed to archive messages in Gmail', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Star messages in Gmail
   */
  async starMessages(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;

    const gmail = await this.getGmail();
    
    try {
      for (const messageId of messageIds) {
        await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            addLabelIds: ['STARRED']
          }
        });
      }
      
      logger.info('Messages starred in Gmail', { 
        count: messageIds.length 
      });
    } catch (error) {
      logger.error('Failed to star messages in Gmail', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Unstar messages in Gmail
   */
  async unstarMessages(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;

    const gmail = await this.getGmail();
    
    try {
      for (const messageId of messageIds) {
        await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['STARRED']
          }
        });
      }
      
      logger.info('Messages unstarred in Gmail', { 
        count: messageIds.length 
      });
    } catch (error) {
      logger.error('Failed to unstar messages in Gmail', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Move messages to trash in Gmail
   */
  async trashMessages(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;

    const gmail = await this.getGmail();
    
    try {
      for (const messageId of messageIds) {
        await gmail.users.messages.trash({
          userId: 'me',
          id: messageId
        });
      }
      
      logger.info('Messages moved to trash in Gmail', { 
        count: messageIds.length 
      });
    } catch (error) {
      logger.error('Failed to trash messages in Gmail', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
