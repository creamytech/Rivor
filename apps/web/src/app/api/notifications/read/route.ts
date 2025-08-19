import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { markAllNotificationsRead } from '@/server/notifications';

export const dynamic = 'force-dynamic';

export async function PATCH(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    await markAllNotificationsRead(orgId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark notifications as read', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}

