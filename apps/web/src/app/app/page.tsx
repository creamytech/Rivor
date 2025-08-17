"use client";
import { useSession } from "next-auth/react";
import AppShell from "@/components/app/AppShell";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
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

  // Simple data without API calls
  const data = {
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

  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <FlowRibbon />
        <AppShell>
          <div className="container py-6 space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Welcome, {data.userName}!
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Dashboard is working with simplified data.
              </p>
            </div>
          </div>
        </AppShell>
      </div>
    </ToastProvider>
  );
}
