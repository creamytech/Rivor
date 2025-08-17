"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InboxSummaryWidget } from './InboxSummaryWidget';
import { CalendarSnapshotWidget } from './CalendarSnapshotWidget';
import { PipelineGlanceWidget } from './PipelineGlanceWidget';
import { IntegrationStatusPanel } from './IntegrationStatusPanel';
import { ConnectedAccountsPanel } from './ConnectedAccountsPanel';
import { BackfillProgressCard } from './BackfillProgressCard';
import { TokenErrorBanner } from '../common/TokenErrorBanner';
import { SyncButton } from '../common/SyncButton';
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
  const [isLoading, setIsLoading] = useState(false);

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
      {/* Animated Header */}
      <motion.div 
        className="relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-teal-600/20 animate-pulse"></div>
        <div className="relative z-10 px-6 py-8">
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            Good {getGreeting()}, {userName}! 👋
          </motion.h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
            Here's what's flowing through your workflow today.
          </p>
        </div>
      </motion.div>

      {/* Activity Ticker */}
      <AnimatePresence>
        {activityTicker.length > 0 && (
          <motion.div 
            className="px-6 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Live Activity:</span>
                <span>{activityTicker[activityTicker.length - 1]}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <motion.div 
        className="px-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
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
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Sync Controls */}
      <motion.div 
        className="px-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex gap-3">
          <SyncButton type="email" />
          <SyncButton type="calendar" />
        </div>
      </motion.div>

      {/* Token Health Banner */}
      <motion.div 
        className="px-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <TokenErrorBanner tokenHealth={tokenHealth} />
      </motion.div>

      {/* Backfill Progress */}
      <motion.div 
        className="px-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <BackfillProgressCard />
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Integration Status */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <IntegrationStatusPanel />
            </motion.div>

            {/* Email Stream */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <InboxSummaryWidget 
                unreadCount={unreadCount} 
                recentThreads={recentThreads} 
              />
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Calendar Snapshot */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <CalendarSnapshotWidget 
                upcomingEvents={upcomingEvents}
                calendarStats={calendarStats}
              />
            </motion.div>

            {/* Pipeline Glance */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              <PipelineGlanceWidget 
                pipelineStats={pipelineStats}
                totalActiveLeads={totalActiveLeads}
              />
            </motion.div>
          </div>
        </div>

        {/* Connected Accounts Panel */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <ConnectedAccountsPanel tokenHealth={tokenHealth} />
        </motion.div>
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
