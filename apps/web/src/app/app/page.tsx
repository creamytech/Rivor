"use client";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import QuickActions from "@/components/app/QuickActions";
import FloatingQuickAdd from "@/components/app/FloatingQuickAdd";
import KPIStrip from "@/components/app/KPIStrip";
import GlobalSearch from "@/components/app/GlobalSearch";
import TasksWidget from "@/components/app/TasksWidget";
import QuickActionsWidget from "@/components/app/QuickActionsWidget";
import { BarChart3, Trophy, Target, Zap, Search, Command } from "lucide-react";

// Dynamically import components to avoid SSR issues
const AppShell = dynamic(() => import("@/components/app/AppShell"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
    </div>
  )
});

const DashboardLayout = dynamic(() => import("@/components/app/DashboardLayout"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
    </div>
  )
});

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

  return (
    <AppShell>
      {/* Enhanced Layout with better spacing and visual hierarchy */}
      <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--muted)]/50 to-[var(--background)]">
        {/* KPI Strip with enhanced container */}
        <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    Dashboard
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Welcome back! Here's what's happening with your real estate business.
                  </p>
                </div>
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="text-sm text-muted-foreground">
                    Last updated: <span className="font-medium">2 min ago</span>
                  </div>
                </div>
              </div>
              <KPIStrip className="mb-0" />
            </div>
          </div>
        </div>

        {/* Main Dashboard Content with improved grid */}
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Left Column - Main Dashboard (spans 3 columns) */}
              <div className="xl:col-span-3">
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
                  <DashboardLayout />
                </div>
              </div>

              {/* Right Column - Quick Actions & Tasks (spans 1 column) */}
              <div className="space-y-6">
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-lg">
                  <QuickActionsWidget 
                    className="sticky top-6"
                    showCategories={false}
                  />
                </div>
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-lg">
                  <TasksWidget 
                    className="sticky top-6"
                    maxTasks={6}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuickActions />
      <FloatingQuickAdd />
    </AppShell>
  );
}
