"use client";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import PageHeader from "@/components/app/PageHeader";
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

  const userName = session.user?.name || session.user?.email?.split('@')[0] || 'there';

  // Enhanced 7-day deltas with trends
  const sevenDayDeltas = [
    { 
      label: "Leads", 
      value: "+12%", 
      trend: "up", 
      color: "green",
      icon: <Target className="h-3 w-3" />
    },
    { 
      label: "Deals", 
      value: "+8%", 
      trend: "up", 
      color: "blue",
      icon: <Trophy className="h-3 w-3" />
    },
    { 
      label: "Revenue", 
      value: "+15%", 
      trend: "up", 
      color: "purple",
      icon: <Zap className="h-3 w-3" />
    }
  ];

  // Personalized greeting based on time and user data
  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) return `Good morning, ${userName}`;
    if (hour < 18) return `Good afternoon, ${userName}`;
    return `Good evening, ${userName}`;
  };

  const getGreetingSubtitle = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return `Here's your deal flow at a glance for ${today}`;
  };

  return (
    <AppShell>
      <PageHeader
        title={getPersonalizedGreeting()}
        subtitle={getGreetingSubtitle()}
        icon={<BarChart3 className="h-6 w-6" />}
        metaChips={sevenDayDeltas.map(delta => ({
          label: delta.label,
          value: delta.value,
          color: delta.color
        }))}
        gradientColors={{
          from: "from-blue-600/12",
          via: "via-indigo-600/12",
          to: "to-purple-600/12"
        }}
      />

      {/* Global Search Bar */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <GlobalSearch 
            placeholder="Search leads, deals, contacts, emails, or use ⌘K for quick actions..."
            className="w-full"
          />
        </div>
      </div>

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
                compact={true}
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
