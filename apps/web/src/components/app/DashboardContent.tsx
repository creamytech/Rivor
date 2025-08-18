"use client";
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
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
  className?: string;
}

export default function DashboardContent({ className = '' }: DashboardContentProps) {
  const [activityTicker, setActivityTicker] = useState<string[]>([]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Fetch real data from tRPC
  const { data: dashboardData, isLoading: dashboardLoading } = trpc.dashboard.useQuery();
  const { data: leadsData, isLoading: leadsLoading } = trpc.leads.list.useQuery({ limit: 10 });
  const { data: pipelineStagesData, isLoading: pipelineLoading } = trpc.pipelineStages.list.useQuery();
  const { data: integrationsData, isLoading: integrationsLoading } = trpc.integrations.health.useQuery();

  // Activity ticker simulation
  useEffect(() => {
    const activities = [
      "New lead detected from email",
      "Meeting scheduled for tomorrow",
      "Pipeline stage updated",
      "Contact enriched with company data",
      "Task completed: Follow up call"
    ];

    const interval = setInterval(() => {
      setActivityTicker(prev => {
        const newActivity = activities[Math.floor(Math.random() * activities.length)];
        const updated = [newActivity, ...prev.slice(0, 4)];
        return updated;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Handle Command+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (dashboardLoading || leadsLoading || pipelineLoading || integrationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="space-y-6">
                <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      
      {/* Today at a Glance - First scannable row */}
      <div className="px-6 py-6">
        <TodayAtAGlance 
          leadsData={dashboardData?.leadsData}
          repliesData={dashboardData?.repliesData}
          meetingsData={dashboardData?.meetingsData}
          tokenHealthData={dashboardData?.tokenHealthData}
        />
      </div>

      {/* Activity Ticker */}
      {activityTicker.length > 0 && (
        <div className="px-6 mb-6">
          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Live Activity:</span>
              <span>{activityTicker[0]}</span>
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
            <LeadFeed 
              leads={leadsData?.leads || []} 
              reviewItems={[]} 
            />
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            {/* Health Widget */}
            <HealthWidget 
              integrations={integrationsData?.emailAccounts || []} 
              onFix={(id) => console.log('Fix integration:', id)} 
              onReauth={(id) => console.log('Reauth integration:', id)} 
            />
            
            {/* Mini Pipeline Sparkline */}
            <MiniPipelineSparkline 
              stages={pipelineStagesData || []} 
              totalLeads={leadsData?.total || 0} 
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
