"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import AppShell from "@/components/app/AppShell";
import DashboardContent from "@/components/app/DashboardContent";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";

export default function ClientDashboard() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      redirect("/auth/signin");
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

    fetchDashboardData();
  }, [session, status]);

  // Show loading state
  if (status === "loading" || loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-transparent to-blue-50/30 dark:from-teal-900/10 dark:via-transparent dark:to-blue-900/10 animate-pulse" style={{ animationDuration: '8s' }} />
        <FlowRibbon />
        <AppShell>
          <div className="container py-6 space-y-8">
            <div className="text-center text-slate-600 dark:text-slate-400">
              Loading dashboard...
            </div>
          </div>
        </AppShell>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-transparent to-blue-50/30 dark:from-teal-900/10 dark:via-transparent dark:to-blue-900/10 animate-pulse" style={{ animationDuration: '8s' }} />
        <FlowRibbon />
        <AppShell>
          <div className="container py-6 space-y-8">
            <div className="text-center text-red-600 dark:text-red-400">
              {error}
            </div>
          </div>
        </AppShell>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
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

  const data = dashboardData || defaultData;

  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        {/* Subtle animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-transparent to-blue-50/30 dark:from-teal-900/10 dark:via-transparent dark:to-blue-900/10 animate-pulse" style={{ animationDuration: '8s' }} />
        
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
