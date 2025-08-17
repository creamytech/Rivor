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
import { Sparkles } from "lucide-react";

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

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const timeOfDay = getTimeOfDay();

  return (
    <div className="container py-6 space-y-8">
      {/* Token Error Banner */}
      <TokenErrorBanner />
      
      {/* Hero Section */}
      <section>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-teal-400 animate-pulse" />
                <span className="text-sm font-medium text-teal-400 uppercase tracking-wide">
                  {timeOfDay} Flow
                </span>
              </div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {getGreeting()}, {userName}! 👋
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Here's what's flowing through your workflow today.
              </p>
            </div>
            
            {/* Sync buttons */}
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
      </section>

      {/* Onboarding Section */}
      {showOnboarding && (
        <section>
          <FirstRunOnboarding 
            hasEmailIntegration={hasEmailIntegration}
            hasCalendarIntegration={hasCalendarIntegration}
          />
        </section>
      )}

      {/* Integration Status Panel - temporarily removed */}
      {/* <section>
        <IntegrationStatusPanel />
      </section> */}

      {/* Main Dashboard Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email/Inbox Widget - temporarily removed */}
        {/* <div className="lg:col-span-2">
          <InboxSummaryWidget 
            unreadCount={unreadCount}
            recentThreads={recentThreads}
          />
        </div> */}

        {/* Calendar Widget - temporarily removed */}
        {/* <div>
          <CalendarSnapshotWidget 
            upcomingEvents={upcomingEvents}
            calendarStats={calendarStats}
          />
        </div> */}
      </section>

      {/* Pipeline Widget - temporarily removed */}
      {/* <section>
        <PipelineGlanceWidget 
          pipelineStats={pipelineStats}
          totalActiveLeads={totalActiveLeads}
        />
      </section> */}

      {/* Backfill Progress - temporarily removed */}
      {/* <section>
        <BackfillProgressCard />
      </section> */}

      {/* Flow Cards */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <HeroFlowCard />
          <FlowCard 
            title="Email Management"
            description="Organize and prioritize your inbox"
            icon="mail"
            status={hasEmailIntegration ? 'connected' : 'disconnected'}
            href="/app/inbox"
          />
          <FlowCard 
            title="Calendar Sync"
            description="Keep your schedule in sync"
            icon="calendar"
            status={hasCalendarIntegration ? 'connected' : 'disconnected'}
            href="/app/calendar"
          />
        </div>
      </section>
    </div>
  );
}
