"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import AppShell from "@/components/app/AppShell";
import DashboardContent from "@/components/app/DashboardContent";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      redirect("/auth/signin");
      return;
    }

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session, status]);

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

  if (!session) {
    return null; // Will redirect
  }

  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        {/* Subtle animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-transparent to-blue-50/30 dark:from-teal-900/10 dark:via-transparent dark:to-blue-900/10 animate-pulse" style={{ animationDuration: '8s' }} />
        
        <FlowRibbon />
        <AppShell>
          <DashboardContent 
            userName={dashboardData?.userName || session.user?.name || session.user?.email?.split('@')[0] || 'there'}
            showOnboarding={dashboardData?.showOnboarding || false}
            hasEmailIntegration={dashboardData?.hasEmailIntegration || false}
            hasCalendarIntegration={dashboardData?.hasCalendarIntegration || false}
            unreadCount={dashboardData?.unreadCount || 0}
            recentThreads={dashboardData?.recentThreads || []}
            upcomingEvents={dashboardData?.upcomingEvents || []}
            calendarStats={dashboardData?.calendarStats || { todayCount: 0, upcomingCount: 0 }}
            pipelineStats={dashboardData?.pipelineStats || []}
            totalActiveLeads={dashboardData?.totalActiveLeads || 0}
            tokenHealth={dashboardData?.tokenHealth || []}
          />
        </AppShell>
      </div>
    </ToastProvider>
  );
}
