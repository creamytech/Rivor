"use client";
import { useParams, useRouter } from 'next/navigation';
import AppShell from "@/components/app/AppShell";
import ThreadView from "@/components/inbox/ThreadView";
import FlowRibbon from "@/components/river/FlowRibbon";
import { ToastProvider } from "@/components/river/RiverToast";
import TokenErrorBanner from "@/components/common/TokenErrorBanner";

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;

  const handleBack = () => {
    router.push('/app/inbox');
  };

  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <FlowRibbon />
        <AppShell>
          <div className="container py-6 space-y-6">
            <TokenErrorBanner />
            
            <ThreadView
              threadId={threadId}
              onBack={handleBack}
              className="min-h-[600px]"
            />
          </div>
        </AppShell>
      </div>
    </ToastProvider>
  );
}