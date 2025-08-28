import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Delete all notifications for the organization
    const deletedCount = await prisma.notification.deleteMany({
      where: { 
        orgId,
        userId: session.user.id 
      }
    });

    return NextResponse.json({ 
      success: true, 
      cleared: deletedCount.count,
      message: `${deletedCount.count} notifications cleared` 
    });
  } catch (error) {
    console.error('Clear notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 },
    );
  }
}