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

    const { starred } = await req.json();
    const threadId = params.threadId;

    // Verify thread belongs to org
    const thread = await prisma.emailThread.findFirst({
      where: { id: threadId, orgId }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Update starred status
    await prisma.emailThread.update({
      where: { id: threadId },
      data: { starred }
    });

    logger.info('Thread starred status updated', { 
      threadId, 
      starred, 
      orgId 
    });

    return NextResponse.json({ success: true, starred });

  } catch (error) {
    logger.error('Failed to update thread starred status', { error });
    return NextResponse.json(
      { error: 'Failed to update starred status' },
      { status: 500 }
    );
  }
}
