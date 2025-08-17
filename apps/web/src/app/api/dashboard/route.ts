import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { listThreads, getUnreadCount } from '@/server/email';
import { getUpcomingEvents, getCalendarStats } from '@/server/calendar';
import { getPipelineStats, getOverallPipelineStats } from '@/server/pipeline';
import { checkTokenHealth } from '@/server/oauth';
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

    // Fetch real data in parallel
    const [
      recentThreads,
      unreadCount,
      upcomingEvents,
      calendarStats,
      pipelineStats,
      overallStats,
      tokenHealth
    ] = await Promise.all([
      listThreads(orgId || '', 10).catch(() => []),
      getUnreadCount(orgId || '').catch(() => 0),
      getUpcomingEvents(orgId || '', 5).catch(() => []),
      getCalendarStats(orgId || '').catch(() => ({ todayCount: 0, upcomingCount: 0 })),
      getPipelineStats(orgId || '').catch(() => []),
      getOverallPipelineStats(orgId || '').catch(() => ({ activeLeads: 0, wonLeads: 0, lostLeads: 0, totalLeads: 0 })),
      userEmail ? checkTokenHealth(userEmail).catch(() => []) : []
    ]);

    // Check integration status based on specific scopes
    const hasEmailIntegration = tokenHealth.some(t => 
      t.connected && !t.expired && (
        t.scopes.includes('https://www.googleapis.com/auth/gmail.readonly') ||
        t.scopes.includes('https://graph.microsoft.com/Mail.Read')
      )
    );
    const hasCalendarIntegration = tokenHealth.some(t => 
      t.connected && !t.expired && (
        t.scopes.includes('https://www.googleapis.com/auth/calendar.readonly') ||
        t.scopes.includes('https://graph.microsoft.com/Calendars.ReadWrite')
      )
    );
    const showOnboarding = !hasEmailIntegration && !hasCalendarIntegration;

    // Debug logging
    console.log('Dashboard integration check:', {
      userEmail,
      hasEmailIntegration,
      hasCalendarIntegration,
      showOnboarding,
      tokenHealthCount: tokenHealth.length
    });

    return Response.json({
      userName,
      showOnboarding,
      hasEmailIntegration,
      hasCalendarIntegration,
      unreadCount,
      recentThreads,
      upcomingEvents,
      calendarStats,
      pipelineStats,
      totalActiveLeads: overallStats.activeLeads,
      tokenHealth
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
