import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { logger } from '@/lib/logger';
import { checkTokenHealth } from '@/server/oauth';

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

    // Check token health with better error handling
    let tokenHealth = [];
    let hasEmailIntegration = false;
    let hasCalendarIntegration = false;
    let showOnboarding = true;

    try {
      tokenHealth = userEmail ? await checkTokenHealth(userEmail).catch(() => []) : [];

      // Check integration status based on specific scopes
      hasEmailIntegration = tokenHealth.some(t => 
        t.connected && !t.expired && (
          t.scopes.includes('https://www.googleapis.com/auth/gmail.readonly') ||
          t.scopes.includes('https://graph.microsoft.com/Mail.Read')
        )
      );
      hasCalendarIntegration = tokenHealth.some(t => 
        t.connected && !t.expired && (
          t.scopes.includes('https://www.googleapis.com/auth/calendar.readonly') ||
          t.scopes.includes('https://graph.microsoft.com/Calendars.ReadWrite')
        )
      );
      showOnboarding = !hasEmailIntegration && !hasCalendarIntegration;
    } catch (error) {
      console.error('Token health check failed:', error);
      // Use default values if token health check fails
      tokenHealth = [];
      hasEmailIntegration = false;
      hasCalendarIntegration = false;
      showOnboarding = true;
    }

    // Return data with token health
    return Response.json({
      userName,
      showOnboarding,
      hasEmailIntegration,
      hasCalendarIntegration,
      unreadCount: 0,
      recentThreads: [],
      upcomingEvents: [],
      calendarStats: { todayCount: 0, upcomingCount: 0 },
      pipelineStats: [],
      totalActiveLeads: 0,
      tokenHealth
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
