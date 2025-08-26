import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";

export const dynamic = 'force-dynamic';

/**
 * Get detailed thread information including full message content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { threadId } = params;

    if (!threadId) {
      return NextResponse.json({ error: "Thread ID is required" }, { status: 400 });
    }

    // Get thread with all messages
    const thread = await db.emailThread.findUnique({
      where: { id: threadId },
      include: {
        messages: {
          select: {
            id: true,
            messageId: true,
            subject: true,
            snippet: true,
            bodyTextEnc: true,
            bodyHtmlEnc: true,
            fromEmail: true,
            fromName: true,
            toEmail: true,
            toName: true,
            ccEmail: true,
            bccEmail: true,
            receivedAt: true,
            sentAt: true,
            isRead: true,
            labelIds: true,
            hasAttachments: true,
            inReplyTo: true,
            references: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: {
            receivedAt: 'asc'
          }
        },
        org: true
      }
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Decrypt message content if available
    const messagesWithContent = await Promise.all(
      thread.messages.map(async (message) => {
        let bodyText: string | null = null;
        let bodyHtml: string | null = null;

        try {
          // Try to decrypt content if encrypted
          if (message.bodyTextEnc && thread.org?.id) {
            const { decryptForOrg } = await import('@/server/secure-tokens');
            try {
              const decryptedTextBytes = await decryptForOrg(
                thread.org.id,
                message.bodyTextEnc,
                `email:text:${message.id}`
              );
              bodyText = new TextDecoder().decode(decryptedTextBytes);
            } catch (decryptError) {
              console.warn('Failed to decrypt text content:', decryptError);
              bodyText = message.snippet || 'Content not available';
            }
          }

          if (message.bodyHtmlEnc && thread.org?.id) {
            const { decryptForOrg } = await import('@/server/secure-tokens');
            try {
              const decryptedHtmlBytes = await decryptForOrg(
                thread.org.id,
                message.bodyHtmlEnc,
                `email:html:${message.id}`
              );
              bodyHtml = new TextDecoder().decode(decryptedHtmlBytes);
            } catch (decryptError) {
              console.warn('Failed to decrypt HTML content:', decryptError);
              // Try to create HTML from text if available
              if (bodyText) {
                bodyHtml = `<div style="white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${bodyText.replace(/\n/g, '<br>')}</div>`;
              }
            }
          }

          // If no encrypted content, use snippet as fallback
          if (!bodyText && !bodyHtml) {
            bodyText = message.snippet || 'No content available';
            bodyHtml = `<div style="white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${bodyText.replace(/\n/g, '<br>')}</div>`;
          }

        } catch (error) {
          console.error('Error processing message content:', error);
          bodyText = message.snippet || 'Content processing error';
          bodyHtml = `<div style="white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${bodyText}</div>`;
        }

        return {
          ...message,
          bodyText,
          bodyHtml,
          // Remove encrypted fields from response
          bodyTextEnc: undefined,
          bodyHtmlEnc: undefined
        };
      })
    );

    return NextResponse.json({
      success: true,
      thread: {
        ...thread,
        messages: messagesWithContent,
        org: undefined // Don't send org details to frontend
      }
    });

  } catch (error) {
    console.error('Get thread error:', error);
    return NextResponse.json({
      error: "Failed to get thread details",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Update thread properties (read status, starred, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { threadId } = params;
    const { isRead, starred, labels } = await request.json();

    if (!threadId) {
      return NextResponse.json({ error: "Thread ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    
    if (typeof isRead === 'boolean') {
      updateData.isRead = isRead;
    }
    
    if (typeof starred === 'boolean') {
      updateData.starred = starred;
    }
    
    if (Array.isArray(labels)) {
      updateData.labelIds = labels;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid update fields provided" }, { status: 400 });
    }

    // Update thread
    const updatedThread = await db.emailThread.update({
      where: { id: threadId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    // If marking as read/unread, update all messages in thread
    if (typeof isRead === 'boolean') {
      await db.emailMessage.updateMany({
        where: { threadId },
        data: { isRead }
      });
    }

    return NextResponse.json({
      success: true,
      thread: updatedThread
    });

  } catch (error) {
    console.error('Update thread error:', error);
    return NextResponse.json({
      error: "Failed to update thread",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}