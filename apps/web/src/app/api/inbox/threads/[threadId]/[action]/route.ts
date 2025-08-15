import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

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

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { threadId, action } = params;

    // Skip demo threads
    if (threadId.startsWith('demo-')) {
      return NextResponse.json({ success: true });
    }

    let updateData: any = {};

    switch (action) {
      case 'star':
        updateData.starred = true;
        break;
      case 'unstar':
        updateData.starred = false;
        break;
      case 'read':
        updateData.unread = false;
        break;
      case 'unread':
        updateData.unread = true;
        break;
      case 'archive':
        // Remove from inbox label and add archived label
        const currentThread = await prisma.emailThread.findUnique({
          where: { id: threadId, orgId },
          select: { labels: true }
        });
        
        if (currentThread) {
          const labels = (currentThread.labels || []).filter((l: string) => l !== 'inbox');
          if (!labels.includes('archived')) {
            labels.push('archived');
          }
          updateData.labels = labels;
        }
        break;
      case 'delete':
        // For safety, we'll just hide the thread by removing all labels except 'deleted'
        updateData.labels = ['deleted'];
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedThread = await prisma.emailThread.update({
      where: {
        id: threadId,
        orgId
      },
      data: updateData
    });

    return NextResponse.json({ success: true, thread: updatedThread });

  } catch (error: any) {
    console.error('Thread action API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform thread action' },
      { status: 500 }
    );
  }
}
