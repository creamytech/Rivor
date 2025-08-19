"use client";
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import TodayAtAGlance from './TodayAtAGlance';
import CompactSyncProgress from './CompactSyncProgress';
import LeadFeed from './LeadFeed';
import HealthWidget from './HealthWidget';
import MiniPipelineSparkline from './MiniPipelineSparkline';
import StickyActionStrip from './StickyActionStrip';
import ActivityFeed from './ActivityFeed';
import CommandPalette from '../common/CommandPalette';
import { CurvedDivider } from '@/components/ui/curved-divider';

interface DashboardContentProps {
  className?: string;
}

interface SyncStatus {
  accountsTotal: number;
  accountsConnected: number;
  accountsBackfilling: number;
  accountsError: number;
  threadsTotal: number;
  lastSyncAt?: string;
  syncInProgress: boolean;
}

export default function DashboardContent({ className = '' }: DashboardContentProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncLoading, setSyncLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Fetch real data from tRPC - Independent queries for faster loading
  const { data: dashboardData, isLoading: dashboardLoading } = trpc.dashboard.useQuery(undefined, {
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false
  });
  const { data: leadsData, isLoading: leadsLoading } = trpc.leads.list.useQuery({ limit: 10 }, {
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
  const { data: pipelineStagesData, isLoading: pipelineLoading } = trpc.pipelineStages.list.useQuery(undefined, {
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false
  });
  const { data: integrationsData, isLoading: integrationsLoading } = trpc.integrations.health.useQuery(undefined, {
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        setSyncLoading(true);
        const res = await fetch('/api/sync/status');
        if (!res.ok) throw new Error('Failed to fetch sync status');
        const data = await res.json();
        setSyncStatus(data);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setSyncLoading(false);
      }
    };

    fetchSyncStatus();
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

  const emailProgress = syncStatus?.accountsTotal
    ? (syncStatus.accountsConnected / syncStatus.accountsTotal) * 100
    : 0;
  const emailStatus: 'running' | 'completed' | 'error' = syncStatus?.syncInProgress
    ? 'running'
    : syncStatus && syncStatus.accountsError > 0
      ? 'error'
      : 'completed';

  const emailEta = syncStatus?.syncInProgress ? 'Calculating…' : undefined;

  const emailErrorCount = syncStatus?.accountsError ?? 0;

  const emailTotal = syncStatus?.accountsTotal;
  const emailProcessed = syncStatus?.accountsConnected;

  const calendarAccounts = integrationsData?.calendarAccounts || [];
  const calendarTotal = calendarAccounts.length;
  const calendarConnected = calendarAccounts.filter(acc => acc.status === 'connected').length;
  const calendarErrors = calendarAccounts.filter(acc => acc.status !== 'connected').length;
  const calendarProgress = calendarTotal ? (calendarConnected / calendarTotal) * 100 : 0;
  const calendarStatus: 'running' | 'completed' | 'error' = calendarErrors > 0 ? 'error' : 'completed';

  const contactsAccounts = integrationsData?.emailAccounts || [];
  const contactsTotal = contactsAccounts.length;
  const contactsConnected = contactsAccounts.filter(acc => acc.status === 'connected').length;
  const contactsErrors = contactsAccounts.filter(acc => acc.status !== 'connected').length;
  const contactsProgress = contactsTotal ? (contactsConnected / contactsTotal) * 100 : 0;
  const contactsStatus: 'running' | 'completed' | 'error' = contactsErrors > 0 ? 'error' : 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      
      {/* Today at a Glance - First scannable row */}
      <div className="px-6 py-6">
        {dashboardLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <TodayAtAGlance 
            leadsData={dashboardData?.leadsData}
            repliesData={dashboardData?.repliesData}
            meetingsData={dashboardData?.meetingsData}
            tokenHealthData={dashboardData?.tokenHealthData}
          />
        )}
      </div>

      {/* Curved Divider */}
      <CurvedDivider variant="flow" direction="down" color="cyan" className="mb-2" />

      {/* Compact Sync Progress - Reduced prominence */}
      <div className="px-6 mb-6">
        {syncLoading || integrationsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            ))}
          </div>
        ) : syncError ? (
          <div className="text-sm text-red-500">{syncError}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CompactSyncProgress
              syncType="email"
              progress={emailProgress}
              status={emailStatus}
              eta={emailEta}
              totalItems={emailTotal}
              processedItems={emailProcessed}
              errorCount={emailErrorCount}
            />
            <CompactSyncProgress
              syncType="calendar"
              progress={calendarProgress}
              status={calendarStatus}
              totalItems={calendarTotal}
              processedItems={calendarConnected}
              errorCount={calendarErrors}
            />
            <CompactSyncProgress
              syncType="contacts"
              progress={contactsProgress}
              status={contactsStatus}
              totalItems={contactsTotal}
              processedItems={contactsConnected}
              errorCount={contactsErrors}
            />
          </div>
        )}
      </div>

      {/* Curved Divider */}
      <CurvedDivider variant="wave" direction="down" color="blue" className="mb-2" />

      {/* Main Dashboard Grid */}
      <div className="px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Feed */}
          <div className="lg:col-span-2">
            {leadsLoading ? (
              <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            ) : (
              <LeadFeed 
                leads={leadsData?.leads || []} 
                reviewItems={[]} 
              />
            )}
          </div>
          
          {/* Right Column - Enhanced with Activity Feed */}
          <div className="space-y-6">
            {/* Activity Feed - New prominent position */}
            <ActivityFeed />
            
            {/* Health Widget */}
            {integrationsLoading ? (
              <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            ) : (
              <HealthWidget 
                integrations={integrationsData?.emailAccounts || []} 
                onFix={(id) => console.log('Fix integration:', id)} 
                onReauth={(id) => console.log('Reauth integration:', id)} 
              />
            )}
            
            {/* Mini Pipeline Sparkline */}
            {pipelineLoading ? (
              <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            ) : (
              <MiniPipelineSparkline 
                stages={pipelineStagesData || []} 
                totalLeads={leadsData?.total || 0} 
                conversionRate={32} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Sticky Action Strip */}
      <StickyActionStrip />
    </div>
  );
}
