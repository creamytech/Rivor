"use client";
import AppShell from "@/components/app/AppShell";
import ChatInterface from "@/components/chat/ChatInterface";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";
import TokenErrorBanner from "@/components/common/TokenErrorBanner";

export default function ChatPage() {
  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <FlowRibbon />
        <AppShell>
          <div className="container py-6 space-y-6">
            <TokenErrorBanner />
            
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  AI Assistant
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Get help with emails, leads, calendar events, and tasks using AI-powered tools.
                </p>
              </div>
              
              <ChatInterface className="min-h-[600px]" />
            </div>
          </div>
        </AppShell>
      </div>
    </ToastProvider>
  );
}
