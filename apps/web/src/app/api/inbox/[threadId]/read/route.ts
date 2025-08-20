import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const threadId = params.threadId;

    // Verify thread belongs to org
    const thread = await prisma.emailThread.findFirst({
      where: { id: threadId, orgId }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Mark thread as read
    await prisma.emailThread.update({
      where: { id: threadId },
      data: { 
        unread: false,
        updatedAt: new Date()
      }
    });

    logger.info('Thread marked as read', { 
      threadId, 
      orgId 
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Failed to mark thread as read', { error });
    return NextResponse.json(
      { error: 'Failed to mark thread as read' },
      { status: 500 }
    );
  }
}
