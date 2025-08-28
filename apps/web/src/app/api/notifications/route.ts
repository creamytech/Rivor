import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Skip auth in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        notifications: [
          {
            id: '1',
            type: 'lead',
            title: 'New Lead Detected',
            message: 'AI detected a potential lead from john@example.com',
            timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
            isRead: false,
            priority: 'high',
            actionUrl: '/app/inbox'
          },
          {
            id: '2',
            type: 'task',
            title: 'Follow-up Required',
            message: 'Property inquiry from Sarah needs response within 24 hours',
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            isRead: false,
            priority: 'medium',
            actionUrl: '/app/tasks'
          }
        ]
      });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const notifications = await prisma.notification.findMany({
      where: { orgId, userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const formatted = notifications.map((n) => ({
      id: n.id,
      type: n.type as 'email' | 'meeting' | 'lead' | 'system' | 'integration' | 'task',
      title: n.title,
      message: n.message,
      timestamp: n.createdAt.toISOString(),
      isRead: n.isRead,
      priority: n.priority as 'low' | 'medium' | 'high',
      actionUrl: n.actionUrl,
    }));

    return NextResponse.json({ notifications: formatted });
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 },
    );
  }
}
