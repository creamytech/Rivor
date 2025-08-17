"use client";
import { useState, useEffect } from 'react';
import TodayAtAGlance from './TodayAtAGlance';
import CompactSyncProgress from './CompactSyncProgress';
import LeadFeed from './LeadFeed';
import HealthWidget from './HealthWidget';
import MiniPipelineSparkline from './MiniPipelineSparkline';
import StickyActionStrip from './StickyActionStrip';
import CommandPalette from '../common/CommandPalette';
import { Button } from '@/components/ui/button';
import { Search, Plus, Calendar, Mail, MessageSquare } from 'lucide-react';

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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

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

  // Mock data for new components
  const mockLeadsData = {
    new: 12,
    total: 156,
    trend: 'up' as const
  };

  const mockRepliesData = {
    due: 8,
    overdue: 2
  };

  const mockMeetingsData = {
    today: 3,
    upcoming: 7
  };

  const mockTokenHealthData = {
    status: 'healthy' as const,
    lastSync: '2 hours ago',
    errors: 0
  };

  const mockIntegrations = [
    {
      id: 'gmail',
      name: 'Gmail',
      type: 'email' as const,
      status: 'healthy' as const,
      lastSync: '2 hours ago',
      errors: 0,
      needsReauth: false,
      isConnected: true
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      type: 'calendar' as const,
      status: 'warning' as const,
      lastSync: '1 day ago',
      errors: 2,
      needsReauth: false,
      isConnected: true
    }
  ];

  const mockPipelineStages = [
    { name: 'New', count: 25, color: 'blue', dropOffRate: 15 },
    { name: 'Qualified', count: 18, color: 'green', dropOffRate: -5 },
    { name: 'Meeting', count: 12, color: 'yellow', dropOffRate: 8 },
    { name: 'Closed', count: 8, color: 'purple', dropOffRate: -12 }
  ];

  const mockLeads = [
    {
      id: '1',
      subject: 'Property inquiry - 123 Main St',
      sender: { name: 'John Smith', email: 'john@email.com' },
      intent: 'buyer' as const,
      confidence: 85,
      lastReplyTime: '2 hours ago',
      stage: 'new' as const,
      hasAttachment: false,
      isUnread: true
    },
    {
      id: '2',
      subject: 'Commercial property viewing request',
      sender: { name: 'Sarah Johnson', email: 'sarah@company.com' },
      intent: 'seller' as const,
      confidence: 92,
      lastReplyTime: '1 day ago',
      stage: 'qualified' as const,
      hasAttachment: true,
      isUnread: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />

      {/* Header with Search */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-teal-600/20 animate-pulse"></div>
        <div className="relative z-10 px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                Good {getGreeting()}, {userName}! 👋
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
                Here's what's flowing through your workflow today.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommandPaletteOpen(true)}
              className="backdrop-blur-sm border-white/20"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Today at a Glance */}
      <div className="px-6 mb-6">
        <TodayAtAGlance
          leadsData={mockLeadsData}
          repliesData={mockRepliesData}
          meetingsData={mockMeetingsData}
          tokenHealthData={mockTokenHealthData}
        />
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

      {/* Compact Sync Progress */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CompactSyncProgress
            syncType="email"
            progress={75}
            status="running"
            eta="15 min"
            totalItems={5000}
            processedItems={3750}
            errorCount={2}
          />
          <CompactSyncProgress
            syncType="calendar"
            progress={100}
            status="completed"
            totalItems={200}
            processedItems={200}
          />
          <CompactSyncProgress
            syncType="contacts"
            progress={45}
            status="paused"
            totalItems={1000}
            processedItems={450}
          />
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Feed */}
          <div className="lg:col-span-2">
            <LeadFeed leads={mockLeads} reviewItems={[]} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Health Widget */}
            <HealthWidget 
              integrations={mockIntegrations}
              onFix={(id) => console.log('Fix integration:', id)}
              onReauth={(id) => console.log('Reauth integration:', id)}
            />

            {/* Mini Pipeline Sparkline */}
            <MiniPipelineSparkline
              stages={mockPipelineStages}
              totalLeads={63}
              conversionRate={32}
            />
          </div>
        </div>
      </div>

      {/* Sticky Action Strip */}
      <StickyActionStrip />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
