import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Development bypass - return mock data
    if (process.env.NODE_ENV === 'development') {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'lead' as const,
          title: 'New Lead Received',
          message: 'Sarah Johnson submitted an inquiry for downtown investment property',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          isRead: false,
          priority: 'high' as const
        },
        {
          id: 'notif-2',
          type: 'email' as const,
          title: 'Email Response Required',
          message: 'Michael Chen replied to your commercial property proposal',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          isRead: false,
          priority: 'medium' as const
        },
        {
          id: 'notif-3',
          type: 'meeting' as const,
          title: 'Upcoming Appointment',
          message: 'Property showing with Emma Rodriguez in 1 hour',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
          isRead: true,
          priority: 'high' as const
        },
        {
          id: 'notif-4',
          type: 'task' as const,
          title: 'Task Due Tomorrow',
          message: 'Follow up with Sarah Johnson - property details due',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          isRead: true,
          priority: 'medium' as const
        },
        {
          id: 'notif-5',
          type: 'integration' as const,
          title: 'Email Sync Complete',
          message: 'Successfully synced 15 new emails from Gmail',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          isRead: true,
          priority: 'low' as const
        },
        {
          id: 'notif-6',
          type: 'system' as const,
          title: 'Contract Signed',
          message: 'Family home purchase contract signed by Emma Rodriguez',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          isRead: true,
          priority: 'high' as const
        },
        {
          id: 'notif-7',
          type: 'lead' as const,
          title: 'Lead Status Updated',
          message: 'David Kim moved to "Closed Won" stage - $750k commission earned',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          isRead: true,
          priority: 'medium' as const
        }
      ];

      return NextResponse.json(mockNotifications);
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
