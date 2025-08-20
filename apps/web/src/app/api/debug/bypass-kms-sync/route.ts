import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { google } from 'googleapis';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const orgId = (session as { orgId?: string }).orgId;

    if (!orgId || orgId === 'unknown') {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // Get user to find correct userId
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get OAuth account directly from NextAuth
    const oauthAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: 'google'
      }
    });

    if (!oauthAccount?.access_token) {
      return NextResponse.json({ error: "No OAuth access token found" }, { status: 404 });
    }

    // Get EmailAccount for this user
    const emailAccount = await prisma.emailAccount.findFirst({
      where: { 
        orgId,
        userId: user.id,
        provider: 'google'
      }
    });

    if (!emailAccount) {
      return NextResponse.json({ error: "EmailAccount not found" }, { status: 404 });
    }

    logger.info('Starting bypass KMS Gmail sync', {
      userEmail,
      orgId,
      emailAccountId: emailAccount.id,
      hasAccessToken: !!oauthAccount.access_token
    });

    // Update sync status to running
    await prisma.emailAccount.update({
      where: { id: emailAccount.id },
      data: { 
        syncStatus: 'running',
        lastSyncedAt: new Date()
      }
    });

    try {
      // Create Gmail client directly with OAuth tokens
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
      );

      oauth2Client.setCredentials({
        access_token: oauthAccount.access_token,
        refresh_token: oauthAccount.refresh_token,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Sync recent messages (last 7 days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      
      logger.info('Starting Gmail backfill with bypass', {
        orgId,
        emailAccountId: emailAccount.id,
        cutoffDate: cutoffDate.toISOString()
      });

      let pageToken: string | undefined;
      let processedCount = 0;
      let totalThreads = 0;

      // First, sync threads from the specified date range
      do {
        const response = await gmail.users.threads.list({
          userId: 'me',
          maxResults: 20, // Smaller batch for testing
          pageToken,
          q: `after:${Math.floor(cutoffDate.getTime() / 1000)}`, // Gmail query for date filter
        });

        const threads = response.data.threads || [];
        totalThreads += threads.length;
        
        for (const thread of threads) {
          if (thread.id) {
            await processThread(gmail, orgId, emailAccount.id, thread.id);
            processedCount++;

            // Log progress every 5 threads
            if (processedCount % 5 === 0) {
              logger.info('Gmail backfill progress', {
                orgId,
                emailAccountId: emailAccount.id,
                processedThreads: processedCount,
              });
            }
          }
        }

        pageToken = response.data.nextPageToken || undefined;
        
        // Limit to prevent overwhelming the system
        if (processedCount >= 50) break;
        
      } while (pageToken);

      // Update sync status to idle (completed)
      await prisma.emailAccount.update({
        where: { id: emailAccount.id },
        data: { 
          syncStatus: 'idle',
          lastSyncedAt: new Date()
        }
      });

      // Count synced messages
      const messageCount = await prisma.emailMessage.count({
        where: { 
          thread: { 
            accountId: emailAccount.id 
          } 
        }
      });

      const threadCount = await prisma.emailThread.count({
        where: { accountId: emailAccount.id }
      });

      return NextResponse.json({
        success: true,
        message: 'Bypass KMS Gmail sync completed successfully',
        emailAccountId: emailAccount.id,
        orgId,
        syncStatus: 'idle',
        syncedMessages: messageCount,
        syncedThreads: threadCount,
        processedThreads: processedCount,
        totalThreads,
        cutoffDate: cutoffDate.toISOString(),
        timestamp: new Date().toISOString()
      });

    } catch (syncError: any) {
      logger.error('Bypass KMS Gmail sync failed', {
        orgId,
        emailAccountId: emailAccount.id,
        error: syncError.message,
        stack: syncError.stack
      });

      // Update sync status to error
      await prisma.emailAccount.update({
        where: { id: emailAccount.id },
        data: { 
          syncStatus: 'error',
          errorReason: syncError.message
        }
      });

      return NextResponse.json({
        error: "Bypass KMS Gmail sync failed",
        details: syncError.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error: any) {
    logger.error('Failed to perform bypass KMS Gmail sync', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: "Failed to perform bypass KMS Gmail sync", details: error.message }, { status: 500 });
  }
}

async function processThread(gmail: any, orgId: string, emailAccountId: string, threadId: string): Promise<void> {
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
        await processMessage(gmail, orgId, emailAccountId, message.id);
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

async function processMessage(gmail: any, orgId: string, emailAccountId: string, messageId: string): Promise<void> {
  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const message = response.data;
    if (!message) return;

    // Check if message already exists
    const existing = await prisma.emailMessage.findFirst({
      where: { messageId: message.id, orgId }
    });

    if (existing) return; // Already synced

    // Extract headers
    const headers = message.payload.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
    
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
          const partContentType = partHeaders.find((h: any) => h.name.toLowerCase() === 'content-type')?.value || '';
          
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

    // Find or create thread based on subject
    let thread = await prisma.emailThread.findFirst({
      where: { 
        orgId,
        accountId: emailAccountId,
        subjectIndex: { contains: subject.toLowerCase() }
      }
    });

    if (!thread) {
      thread = await prisma.emailThread.create({
        data: {
          orgId,
          accountId: emailAccountId,
          subjectIndex: subject.toLowerCase(),
          participantsIndex: `${from} ${to} ${cc || ''} ${bcc || ''}`.toLowerCase(),
        }
      });
    }

    // Create message with enhanced content
    await prisma.emailMessage.create({
      data: {
        orgId,
        threadId: thread.id,
        messageId: message.id,
        sentAt: new Date(message.internalDate ? parseInt(message.internalDate) : Date.now()),
        subjectIndex: subject.toLowerCase(),
        participantsIndex: `${from} ${to} ${cc || ''} ${bcc || ''}`.toLowerCase(),
        // attachments field removed because it is not a valid property for this model
      }
    });

    // Log the message details for debugging
    logger.info('Processed message', {
      subject,
      from,
      to,
      hasHtmlBody: !!htmlBody,
      hasTextBody: !!textBody,
      snippet: snippet.substring(0, 100),
      attachments: attachments.length
    });

  } catch (error) {
    console.error(`Error processing message ${messageId}:`, error);
  }
}
