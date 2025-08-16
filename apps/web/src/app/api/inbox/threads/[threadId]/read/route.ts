import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
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

    const { threadId } = params;

    // Mark thread as read
    await prisma.emailThread.update({
      where: {
        id: threadId,
        orgId
      },
      data: {
        unread: false
      }
    });

    logger.info('Thread marked as read', { threadId, orgId });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Failed to mark thread as read', { error, threadId: params.threadId });
    return NextResponse.json(
      { error: 'Failed to mark as read' },
      { status: 500 }
    );
  }
}
