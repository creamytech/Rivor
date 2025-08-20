"use client";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useTheme } from "@/contexts/ThemeContext";
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
  const { currentTheme } = useTheme();

  if (status === "loading") {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: currentTheme.colors.background }}
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: currentTheme.colors.primary }}
          ></div>
          <p style={{ color: currentTheme.colors.textSecondary }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: currentTheme.colors.background }}
      >
        <div className="text-center">
          <h1 
            className="text-2xl font-bold mb-4"
            style={{ color: currentTheme.colors.textPrimary }}
          >
            Not Authenticated
          </h1>
          <p style={{ color: currentTheme.colors.textSecondary }}>
            Please sign in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      {/* New Story-Driven Dashboard Layout */}
      <DashboardLayout />
    </AppShell>
  );
}
