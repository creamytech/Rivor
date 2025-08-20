import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function DELETE(
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

    // Delete the thread (this will cascade delete all messages)
    await prisma.emailThread.delete({
      where: {
        id: threadId,
        orgId
      }
    });

    logger.info('Thread deleted', { threadId, orgId });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Failed to delete thread', { error, threadId: params.threadId });
    return NextResponse.json(
      { error: 'Failed to delete thread' },
      { status: 500 }
    );
  }
}
