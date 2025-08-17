"use client";
import { useState, useEffect } from 'react';
import InboxSummaryWidget from './InboxSummaryWidget';
import CalendarSnapshotWidget from './CalendarSnapshotWidget';
import PipelineGlanceWidget from './PipelineGlanceWidget';
import IntegrationStatusPanel from './IntegrationStatusPanel';
import ConnectedAccountsPanel from './ConnectedAccountsPanel';
import BackfillProgressCard from './BackfillProgressCard';
import TokenErrorBanner from '../common/TokenErrorBanner';
import SyncButton from '../common/SyncButton';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Mail, Briefcase, MessageSquare } from 'lucide-react';

interface DashboardContentProps {
  userName: string;
  showOnboarding: boolean;
  hasEmailIntegration: boolean;
  hasCalendarIntegration: boolean;
  unreadCount: number;
  recentThreads: any[];
  upcomingEvents: any[];
  calendarStats: { todayCount: number; upcomingCount: number };
  pipelineStats: any[];
  totalActiveLeads: number;
  tokenHealth: any[];
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
  const [activityTicker, setActivityTicker] = useState<string[]>([]);

  // Simulate real-time activity ticker
  useEffect(() => {
    const activities = [
      `${unreadCount} new emails just arrived`,
      `${upcomingEvents.length} upcoming events today`,
      `${totalActiveLeads} active deals in pipeline`,
      "Email sync completed successfully"
    ];

    const interval = setInterval(() => {
      setActivityTicker(prev => {
        const newActivity = activities[Math.floor(Math.random() * activities.length)];
        return [...prev.slice(-2), newActivity];
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [unreadCount, upcomingEvents.length, totalActiveLeads]);

  const quickActions = [
    { icon: Plus, label: "Add Deal", href: "/app/pipeline", color: "bg-green-500/10 hover:bg-green-500/20" },
    { icon: Calendar, label: "Schedule Meeting", href: "/app/calendar", color: "bg-blue-500/10 hover:bg-blue-500/20" },
    { icon: Mail, label: "Compose Email", href: "/app/inbox", color: "bg-purple-500/10 hover:bg-purple-500/20" },
    { icon: MessageSquare, label: "Ask AI", href: "/app/chat", color: "bg-teal-500/10 hover:bg-teal-500/20" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-teal-600/20 animate-pulse"></div>
        <div className="relative z-10 px-6 py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
            Good {getGreeting()}, {userName}! 👋
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
            Here's what's flowing through your workflow today.
          </p>
        </div>
      </div>

      {/* Activity Ticker */}
      {activityTicker.length > 0 && (
        <div className="px-6 mb-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Live Activity:</span>
              <span>{activityTicker[activityTicker.length - 1]}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={action.label}
              variant="ghost"
              className={`w-full h-16 ${action.color} backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300`}
              asChild
            >
              <a href={action.href}>
                <div className="flex flex-col items-center gap-2">
                  <action.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{action.label}</span>
                </div>
              </a>
            </Button>
          ))}
        </div>
      </div>

      {/* Sync Controls */}
      <div className="px-6 mb-6">
        <div className="flex gap-3">
          <SyncButton type="email" />
          <SyncButton type="calendar" />
        </div>
      </div>

      {/* Token Health Banner */}
      <div className="px-6 mb-6">
        <TokenErrorBanner />
      </div>

      {/* Backfill Progress */}
      <div className="px-6 mb-6">
        <BackfillProgressCard />
      </div>

      {/* Main Dashboard Grid */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Integration Status */}
            <IntegrationStatusPanel />

            {/* Email Stream */}
            <InboxSummaryWidget 
              unreadCount={unreadCount} 
              recentThreads={recentThreads} 
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Calendar Snapshot */}
            <CalendarSnapshotWidget 
              upcomingEvents={upcomingEvents}
              calendarStats={calendarStats}
            />

            {/* Pipeline Glance */}
            <PipelineGlanceWidget 
              pipelineStats={pipelineStats}
              totalActiveLeads={totalActiveLeads}
            />
          </div>
        </div>

        {/* Connected Accounts Panel */}
        <div className="mt-6">
          <ConnectedAccountsPanel 
            tokenHealth={tokenHealth} 
            userEmail={userName} 
            userName={userName} 
          />
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
