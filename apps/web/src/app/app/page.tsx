import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listThreads, getUnreadCount } from "@/server/email";
import { getUpcomingEvents, getCalendarStats } from "@/server/calendar";
import { getPipelineStats, getOverallPipelineStats } from "@/server/pipeline";
import { checkTokenHealth } from "@/server/oauth";
import AppShell from "@/components/app/AppShell";
import DashboardContent from "@/components/app/DashboardContent";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";
import { logger } from "@/lib/logger";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/auth/signin");
  }

  const orgId = (session as unknown).orgId;
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
    listThreads(orgId, 10).catch(() => []),
    getUnreadCount(orgId).catch(() => 0),
    getUpcomingEvents(orgId, 5).catch(() => []),
    getCalendarStats(orgId).catch(() => ({ todayCount: 0, upcomingCount: 0 })),
    getPipelineStats(orgId).catch(() => []),
    getOverallPipelineStats(orgId).catch(() => ({ activeLeads: 0, wonLeads: 0, lostLeads: 0, totalLeads: 0 })),
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

  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <FlowRibbon />
        <AppShell>
          <DashboardContent 
            userName={userName}
            showOnboarding={showOnboarding}
            hasEmailIntegration={hasEmailIntegration}
            hasCalendarIntegration={hasCalendarIntegration}
            unreadCount={unreadCount}
            recentThreads={recentThreads}
            upcomingEvents={upcomingEvents}
            calendarStats={calendarStats}
            pipelineStats={pipelineStats}
            totalActiveLeads={overallStats.activeLeads}
            tokenHealth={tokenHealth}
          />
        </AppShell>
      </div>
    </ToastProvider>
  );
}
