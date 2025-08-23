import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { GmailService } from '@/server/gmail';

export const dynamic = 'force-dynamic';

/**
 * Thread actions: star, unstar, archive, delete, read
 */
export async function PATCH(req: NextRequest, { params }: { params: { threadId: string; action: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { threadId, action } = params;

    // Skip demo threads
    if (threadId.startsWith('demo-')) {
      return NextResponse.json({ success: true });
    }

    // Get the thread and its messages first to determine if we need Gmail sync
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId, orgId },
      include: {
        messages: {
          select: {
            id: true,
            externalId: true,
            emailAccountId: true
          }
        }
      }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const updateData: unknown = {};
    let needsGmailSync = false;
    let gmailAction: string | null = null;

    // Determine the Gmail sync requirements
    const gmailMessages = thread.messages.filter(msg => msg.externalId && msg.emailAccountId);
    if (gmailMessages.length > 0) {
      needsGmailSync = true;
    }

    switch (action) {
      case 'star':
        updateData.starred = true;
        gmailAction = 'star';
        break;
      case 'unstar':
        updateData.starred = false;
        gmailAction = 'unstar';
        break;
      case 'read':
        updateData.unread = false;
        gmailAction = 'read';
        break;
      case 'unread':
        updateData.unread = true;
        gmailAction = 'unread';
        break;
      case 'archive':
        // Remove from inbox label and add archived label
        const labels = (thread.labels || []).filter((l: string) => l !== 'inbox');
        if (!labels.includes('archived')) {
          labels.push('archived');
        }
        updateData.labels = labels;
        gmailAction = 'archive';
        break;
      case 'delete':
        // For safety, we'll just hide the thread by removing all labels except 'deleted'
        updateData.labels = ['deleted'];
        gmailAction = 'trash';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update local database first
    const updatedThread = await prisma.emailThread.update({
      where: {
        id: threadId,
        orgId
      },
      data: updateData
    });

    // Sync with Gmail if needed
    if (needsGmailSync && gmailAction && gmailMessages.length > 0) {
      try {
        // Group messages by email account
        const messagesByAccount = gmailMessages.reduce((acc, msg) => {
          if (!acc[msg.emailAccountId]) {
            acc[msg.emailAccountId] = [];
          }
          acc[msg.emailAccountId].push(msg.externalId!);
          return acc;
        }, {} as Record<string, string[]>);

        // Sync each account's messages
        for (const [emailAccountId, messageIds] of Object.entries(messagesByAccount)) {
          const gmailService = await GmailService.createFromAccount(orgId, emailAccountId);
          
          switch (gmailAction) {
            case 'star':
              await gmailService.starMessages(messageIds);
              break;
            case 'unstar':
              await gmailService.unstarMessages(messageIds);
              break;
            case 'read':
              await gmailService.markAsRead(messageIds);
              break;
            case 'unread':
              await gmailService.markAsUnread(messageIds);
              break;
            case 'archive':
              await gmailService.archiveMessages(messageIds);
              break;
            case 'trash':
              await gmailService.trashMessages(messageIds);
              break;
          }
        }

        console.log(`Successfully synced ${action} action to Gmail for thread ${threadId}`);
      } catch (error) {
        // Don't fail the request if Gmail sync fails - log it for monitoring
        console.error(`Failed to sync ${action} action to Gmail for thread ${threadId}:`, error);
        // Could add a retry mechanism here or queue for later sync
      }
    }

    return NextResponse.json({ success: true, thread: updatedThread });

  } catch (error: unknown) {
    console.error('Thread action API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform thread action' },
      { status: 500 }
    );
  }
}
