"use client";
import AppShell from "@/components/app/AppShell";
import TasksList from "@/components/tasks/TasksList";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";
import TokenErrorBanner from "@/components/common/TokenErrorBanner";
import { useTheme } from "@/contexts/ThemeContext";

export default function TasksPage() {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen ${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}>
      <ToastProvider>
        <AppShell>
          <FlowRibbon />
          <div className="container mx-auto px-6 py-6">
            <TokenErrorBanner />
            <TasksList />
          </div>
        </AppShell>
      </ToastProvider>
    </div>
  );
}