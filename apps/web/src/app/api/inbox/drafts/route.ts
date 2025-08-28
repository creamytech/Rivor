import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'draft';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get drafts with related email and thread information
    const drafts = await prisma.aISuggestedReply.findMany({
      where: {
        status: status as any,
        // Only get drafts (auto-drafts have category ending with '-auto-draft')
        category: {
          endsWith: status === 'draft' ? '-auto-draft' : undefined
        },
        email: {
          orgId
        }
      },
      include: {
        email: {
          include: {
            thread: {
              include: {
                aiAnalysis: {
                  where: { emailId: { equals: { email: { id: true } } } },
                  take: 1,
                  orderBy: { createdAt: 'desc' }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const totalCount = await prisma.aISuggestedReply.count({
      where: {
        status: status as any,
        category: {
          endsWith: status === 'draft' ? '-auto-draft' : undefined
        },
        email: {
          orgId
        }
      }
    });

    // Transform drafts with decrypted email data
    const { getThreadWithMessages } = await import('@/server/email');
    
    const formattedDrafts = await Promise.all(drafts.map(async (draft) => {
      try {
        // Get decrypted email content
        const threadData = await getThreadWithMessages(orgId, draft.email.threadId);
        const originalMessage = threadData.messages.find(m => m.id === draft.emailId) || 
                               threadData.messages[threadData.messages.length - 1];

        // Parse metadata
        let metadata = {};
        try {
          metadata = JSON.parse(draft.metadata as string || '{}');
        } catch {
          metadata = {};
        }

        return {
          id: draft.id,
          emailId: draft.emailId,
          threadId: draft.threadId,
          suggestedContent: draft.suggestedContent,
          confidenceScore: draft.confidenceScore,
          category: draft.category,
          status: draft.status,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
          metadata,
          // Original email info
          originalEmail: {
            subject: originalMessage?.subject || 'No Subject',
            from: originalMessage?.from || 'Unknown',
            sentAt: originalMessage?.sentAt || draft.email.sentAt,
            snippet: originalMessage?.body?.substring(0, 150) || ''
          },
          // AI analysis info if available
          analysis: draft.email.thread.aiAnalysis?.[0] || null
        };
      } catch (error) {
        logger.error('Error formatting draft', { 
          draftId: draft.id, 
          error: error instanceof Error ? error.message : String(error) 
        });
        return {
          id: draft.id,
          emailId: draft.emailId,
          threadId: draft.threadId,
          suggestedContent: draft.suggestedContent,
          confidenceScore: draft.confidenceScore,
          category: draft.category,
          status: draft.status,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
          metadata: {},
          originalEmail: {
            subject: 'Error loading email',
            from: 'Unknown',
            sentAt: draft.email.sentAt,
            snippet: 'Could not load email content'
          },
          analysis: null
        };
      }
    }));

    return NextResponse.json({
      drafts: formattedDrafts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    logger.error('Failed to fetch drafts', { error });
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { draftId, action, content } = await request.json();

    if (!draftId || !action) {
      return NextResponse.json({ error: 'Missing required fields: draftId, action' }, { status: 400 });
    }

    // Get the draft
    const draft = await prisma.aISuggestedReply.findUnique({
      where: { id: draftId },
      include: { email: true }
    });

    if (!draft || draft.email.orgId !== orgId) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    let updatedDraft;

    switch (action) {
      case 'approve':
        // Convert draft to pending status (ready to send)
        updatedDraft = await prisma.aISuggestedReply.update({
          where: { id: draftId },
          data: {
            status: 'pending',
            category: draft.category.replace('-auto-draft', '-response'),
            userModifications: content || draft.suggestedContent,
            reviewedAt: new Date()
          }
        });
        
        logger.info('Draft approved', { draftId, orgId });
        break;

      case 'edit':
        if (!content) {
          return NextResponse.json({ error: 'Content required for edit action' }, { status: 400 });
        }
        
        updatedDraft = await prisma.aISuggestedReply.update({
          where: { id: draftId },
          data: {
            suggestedContent: content,
            userModifications: content,
            status: 'draft', // Keep as draft after editing
            reviewedAt: new Date()
          }
        });
        
        logger.info('Draft edited', { draftId, orgId });
        break;

      case 'decline':
        updatedDraft = await prisma.aISuggestedReply.update({
          where: { id: draftId },
          data: {
            status: 'declined',
            reviewedAt: new Date()
          }
        });
        
        logger.info('Draft declined', { draftId, orgId });
        break;

      case 'send':
        // Send the draft immediately
        try {
          const sendResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/inbox/send-reply`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify({
              replyId: draftId,
              customContent: content || draft.suggestedContent
            })
          });

          if (!sendResponse.ok) {
            const errorData = await sendResponse.json().catch(() => ({}));
            throw new Error(`Failed to send: ${errorData.details || 'Unknown error'}`);
          }

          const sendData = await sendResponse.json();
          
          logger.info('Draft sent successfully', { draftId, messageId: sendData.messageId });
          
          return NextResponse.json({
            success: true,
            sent: true,
            messageId: sendData.messageId,
            sentAt: sendData.sentAt
          });

        } catch (sendError) {
          logger.error('Failed to send draft', { draftId, error: sendError });
          return NextResponse.json({
            error: `Failed to send draft: ${sendError instanceof Error ? sendError.message : 'Unknown error'}`
          }, { status: 500 });
        }

      default:
        return NextResponse.json({ error: 'Invalid action. Use: approve, edit, decline, or send' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      draft: updatedDraft,
      action
    });

  } catch (error) {
    logger.error('Failed to update draft', { error });
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    );
  }
}