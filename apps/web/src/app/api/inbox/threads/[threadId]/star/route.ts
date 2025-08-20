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
    const { starred } = await req.json();

    // Update thread starred status
    await prisma.emailThread.update({
      where: {
        id: threadId,
        orgId
      },
      data: {
        starred: starred
      }
    });

    logger.info('Thread starred status updated', { threadId, starred, orgId });

    return NextResponse.json({ success: true, starred });

  } catch (error) {
    logger.error('Failed to update thread starred status', { error, threadId: params.threadId });
    return NextResponse.json(
      { error: 'Failed to update starred status' },
      { status: 500 }
    );
  }
}
