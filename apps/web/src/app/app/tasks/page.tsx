"use client";
import AppShell from "@/components/app/AppShell";
import TasksList from "@/components/tasks/TasksList";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";
import TokenErrorBanner from "@/components/common/TokenErrorBanner";

export default function TasksPage() {
  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <FlowRibbon />
        <AppShell>
          <div className="container py-6 space-y-6">
            <TokenErrorBanner />
            
            <div className="space-y-6">
              <TasksList className="min-h-[600px]" />
            </div>
          </div>
        </AppShell>
      </div>
    </ToastProvider>
  );
}