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

    const { threadId } = params;

    // Update thread labels to include 'archived' and remove 'inbox'
    await prisma.emailThread.update({
      where: {
        id: threadId,
        orgId
      },
      data: {
        labels: {
          push: 'archived'
        }
      }
    });

    // Remove 'inbox' label if it exists
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId }
    });

    if (thread?.labels.includes('inbox')) {
      await prisma.emailThread.update({
        where: { id: threadId },
        data: {
          labels: thread.labels.filter(label => label !== 'inbox')
        }
      });
    }

    logger.info('Thread archived', { threadId, orgId });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Failed to archive thread', { error, threadId: params.threadId });
    return NextResponse.json(
      { error: 'Failed to archive thread' },
      { status: 500 }
    );
  }
}
