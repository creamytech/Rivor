import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Try to get a single thread to test the schema
    const thread = await prisma.emailThread.findFirst({
      where: { orgId },
      select: {
        id: true,
        starred: true,
        unread: true,
        labels: true,
        subjectIndex: true
      }
    });

    return NextResponse.json({
      success: true,
      schemaTest: {
        threadFound: !!thread,
        hasStarredField: 'starred' in (thread || {}),
        hasUnreadField: 'unread' in (thread || {}),
        hasLabelsField: 'labels' in (thread || {}),
        threadData: thread
      }
    });

  } catch (error) {
    logger.error('Schema test failed', { error });
    return NextResponse.json(
      { error: 'Schema test failed', details: error },
      { status: 500 }
    );
  }
}
