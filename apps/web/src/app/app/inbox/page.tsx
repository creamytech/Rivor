"use client";
import AppShell from "@/components/app/AppShell";
import ThreadList from "@/components/inbox/ThreadList";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";
import TokenErrorBanner from "@/components/common/TokenErrorBanner";
import SyncButton from "@/components/common/SyncButton";

export default function InboxPage() {

  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <FlowRibbon />
        <AppShell>
          <div className="container py-6 space-y-6">
            <TokenErrorBanner />
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Inbox
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    Manage your email conversations with fast search and actions.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <SyncButton 
                    type="email" 
                    variant="outline"
                    size="sm"
                    onSyncComplete={(result) => {
                      console.log('Email sync completed:', result);
                      // Optionally refresh the thread list
                      window.location.reload();
                    }}
                  />
                </div>
              </div>
              
              <ThreadList className="min-h-[600px]" />
            </div>
          </div>
        </AppShell>
      </div>
    </ToastProvider>
  );
}


