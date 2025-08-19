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


      {/* KPI Strip */}
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <KPIStrip className="mb-8" />
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Dashboard */}
            <div className="lg:col-span-2">
              <DashboardLayout />
            </div>

            {/* Right Column - Quick Actions & Tasks */}
            <div className="space-y-6">
              <QuickActionsWidget 
                className="sticky top-6"
                showCategories={false}
              />
              <TasksWidget 
                className="sticky top-6"
                maxTasks={6}
              />
            </div>
          </div>
        </div>
      </div>

      <QuickActions />
      <FloatingQuickAdd />
    </AppShell>
  );
}
