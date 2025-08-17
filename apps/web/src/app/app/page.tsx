"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AppShell from "@/components/app/AppShell";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";
import DashboardContent from "@/components/app/DashboardContent";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [tokenHealthData, setTokenHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      return;
    }

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        setError(null);
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    // Fetch token health data after a delay
    const fetchTokenHealthData = async () => {
      try {
        // Wait 1 second before fetching token health to avoid blocking initial load
        await new Promise(resolve => setTimeout(resolve, 1000));
        const response = await fetch('/api/token-health');
        if (response.ok) {
          const data = await response.json();
          setTokenHealthData(data);
        }
      } catch (error) {
        console.error('Failed to fetch token health data:', error);
        // Don't set error state for token health as it's not critical
      }
    };

    fetchDashboardData();
    fetchTokenHealthData();
  }, [session, status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Not Authenticated
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Please sign in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Default data if API fails
  const defaultData = {
    userName: session.user?.name || session.user?.email?.split('@')[0] || 'there',
    showOnboarding: true,
    hasEmailIntegration: false,
    hasCalendarIntegration: false,
    unreadCount: 0,
    recentThreads: [],
    upcomingEvents: [],
    calendarStats: { todayCount: 0, upcomingCount: 0 },
    pipelineStats: [],
    totalActiveLeads: 0,
    tokenHealth: []
  };

  // Merge dashboard data with token health data
  const data = {
    ...(dashboardData || defaultData),
    tokenHealth: tokenHealthData?.tokenHealth || defaultData.tokenHealth
  };

  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <FlowRibbon />
        <AppShell>
          <DashboardContent 
            userName={data.userName}
            showOnboarding={data.showOnboarding}
            hasEmailIntegration={data.hasEmailIntegration}
            hasCalendarIntegration={data.hasCalendarIntegration}
            unreadCount={data.unreadCount}
            recentThreads={data.recentThreads}
            upcomingEvents={data.upcomingEvents}
            calendarStats={data.calendarStats}
            pipelineStats={data.pipelineStats}
            totalActiveLeads={data.totalActiveLeads}
            tokenHealth={data.tokenHealth}
          />
        </AppShell>
      </div>
    </ToastProvider>
  );
}
