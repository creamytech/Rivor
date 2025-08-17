import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { logger } from '@/lib/logger';

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

    // Return simple data without calling server functions
    return Response.json({
      userName,
      showOnboarding: true,
      hasEmailIntegration: false,
      hasCalendarIntegration: false,
      unreadCount: 0,
      recentThreads: [],
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
