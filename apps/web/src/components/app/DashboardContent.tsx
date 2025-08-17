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
import HeroFlowCard from "@/components/app/HeroFlowCard";
import BackfillProgressCard from "@/components/app/BackfillProgressCard";
import TokenErrorBanner from "@/components/common/TokenErrorBanner";
import SyncButton from "@/components/common/SyncButton";
import FlowCard from "@/components/river/FlowCard";

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
    <div className="container py-6 space-y-8">
      {/* Token Error Banner */}
      <TokenErrorBanner />
      
      {/* Hero Section */}
      <section>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {getGreeting()}, {userName}! 👋
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Here's what's flowing through your workflow today.
              </p>
            </div>
            
            <div className="flex gap-2">
              <SyncButton 
                type="email" 
                variant="outline"
                size="sm"
                onSyncComplete={(result) => {
                  console.log('Email sync completed:', result);
                  window.location.reload();
                }}
              />
              <SyncButton 
                type="calendar" 
                variant="outline"
                size="sm"
                onSyncComplete={(result) => {
                  console.log('Calendar sync completed:', result);
                  window.location.reload();
                }}
              />
            </div>
          </div>
        </div>
        
        <HeroFlowCard />
      </section>

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
            <div className="flow-in flow-in-delay-1">
              <InboxSummaryWidget 
                unreadCount={unreadCount}
                recentThreads={recentThreads}
              />
            </div>

            {/* Calendar Snapshot */}
            <div className="flow-in flow-in-delay-2">
              <CalendarSnapshotWidget 
                upcomingEvents={upcomingEvents}
                todayCount={calendarStats.todayCount}
              />
            </div>

            {/* Pipeline Glance */}
            <div className="flow-in flow-in-delay-3">
              <PipelineGlanceWidget 
                pipelineStats={pipelineStats}
                totalActiveLeads={totalActiveLeads}
              />
            </div>
          </div>

          {/* Integration Status Panel */}
          <div className="max-w-2xl flow-in flow-in-delay-3">
            <IntegrationStatusPanel />
          </div>
        </div>
      )}
    </div>
  );
}
