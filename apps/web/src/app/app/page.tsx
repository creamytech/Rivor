"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

// Dynamically import components to avoid SSR issues
const AppShell = dynamic(() => import("@/components/app/AppShell").then(mod => ({ default: mod.AppShell })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current-500"></div>
    </div>
  )
});

const DashboardConfluence = dynamic(() => import("@/components/app/DashboardConfluence").then(mod => ({ default: mod.DashboardConfluence })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current-500"></div>
    </div>
  )
});

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      setLoading(false);
      return;
    }

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
      <div className="min-h-screen flex items-center justify-center bg-depth-0">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current-500 mx-auto mb-4"></div>
          <p className="text-foam-60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-depth-0">
        <div className="text-center">
          <h1 className="text-2xl font-bold gradient-text mb-4">
            Not Authenticated
          </h1>
          <p className="text-foam-60">
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

  const data = dashboardData || defaultData;

  return (
    <AppShell
      title="Dashboard"
      subtitle="Here's what's flowing today"
      showSearch={true}
      primaryAction={{
        label: "New Lead",
        onClick: () => console.log("New Lead clicked"),
        icon: <span className="text-lg">+</span>
      }}
    >
      <DashboardConfluence />
    </AppShell>
  );
}
