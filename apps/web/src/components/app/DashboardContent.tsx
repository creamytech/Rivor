"use client";
import { TokenHealth } from "@/server/oauth";
import { UiEmailThread } from "@/server/email";
import { UiCalendarEvent } from "@/server/calendar";
import { PipelineStats } from "@/server/pipeline";
import InboxSummaryWidget from "@/components/app/InboxSummaryWidget";
import CalendarSnapshotWidget from "@/components/app/CalendarSnapshotWidget";
import PipelineGlanceWidget from "@/components/app/PipelineGlanceWidget";
import FirstRunOnboarding from "@/components/app/FirstRunOnboarding";
import IntegrationStatusPanel from "@/components/app/IntegrationStatusPanel";

interface DashboardContentProps {
  userName: string;
  showOnboarding: boolean;
  hasEmailIntegration: boolean;
  hasCalendarIntegration: boolean;
  unreadCount: number;
  recentThreads: UiEmailThread[];
  upcomingEvents: UiCalendarEvent[];
  calendarStats: { todayCount: number; upcomingCount: number };
  pipelineStats: PipelineStats[];
  totalActiveLeads: number;
  tokenHealth: TokenHealth[];
}

export default function DashboardContent({
  userName,
  showOnboarding,
  hasEmailIntegration,
  hasCalendarIntegration,
  unreadCount,
  recentThreads,
  upcomingEvents,
  calendarStats,
  pipelineStats,
  totalActiveLeads,
  tokenHealth
}: DashboardContentProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon"; 
    return "Good evening";
  };

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {getGreeting()}, {userName}! 👋
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Show onboarding for new users, otherwise show widgets */}
      {showOnboarding ? (
        <div className="space-y-6">
          <FirstRunOnboarding 
            hasEmailIntegration={hasEmailIntegration}
            hasCalendarIntegration={hasCalendarIntegration}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inbox Summary */}
            <InboxSummaryWidget 
              unreadCount={unreadCount}
              recentThreads={recentThreads}
            />

            {/* Calendar Snapshot */}
            <CalendarSnapshotWidget 
              upcomingEvents={upcomingEvents}
              todayCount={calendarStats.todayCount}
            />

            {/* Pipeline Glance */}
            <PipelineGlanceWidget 
              pipelineStats={pipelineStats}
              totalActiveLeads={totalActiveLeads}
            />
          </div>

          {/* Integration Status Panel */}
          <div className="max-w-2xl">
            <IntegrationStatusPanel tokenHealth={tokenHealth} />
          </div>
        </div>
      )}
    </div>
  );
}
