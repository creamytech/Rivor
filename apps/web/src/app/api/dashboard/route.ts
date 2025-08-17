import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    const userName = session.user?.name || session.user?.email?.split('@')[0] || 'there';
    const userEmail = session.user?.email;

    // Log dashboard access
    logger.userAction('dashboard_access', userEmail || 'unknown', orgId || 'unknown');

    // Fetch real email data
    let unreadCount = 0;
    let recentThreads = [];
    
    if (orgId) {
      try {
        // Get unread count
        unreadCount = await prisma.emailMessage.count({
          where: {
            orgId,
            read: false
          }
        });

        // Get recent threads
        const threads = await prisma.emailThread.findMany({
          where: { orgId },
          include: {
            messages: {
              orderBy: { sentAt: 'desc' },
              take: 1
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: 5
        });

        recentThreads = threads.map(thread => ({
          id: thread.id,
          subject: thread.subjectIndex || 'No Subject',
          participants: thread.participantsIndex || '',
          lastMessageAt: thread.updatedAt,
          messageCount: thread._count?.messages || 0,
          unreadCount: 0 // We'll calculate this separately if needed
        }));
      } catch (error) {
        console.error('Failed to fetch email data:', error);
        // Use default values if email data fetch fails
        unreadCount = 0;
        recentThreads = [];
      }
    }

    // Return data with real email information
    return Response.json({
      userName,
      showOnboarding: recentThreads.length === 0,
      hasEmailIntegration: recentThreads.length > 0,
      hasCalendarIntegration: false,
      unreadCount,
      recentThreads,
      upcomingEvents: [],
      calendarStats: { todayCount: 0, upcomingCount: 0 },
      pipelineStats: [],
      totalActiveLeads: 0,
      tokenHealth: []
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
