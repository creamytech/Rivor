"use client";
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

const PipelineRiverbanks = dynamic(() => import("@/components/app/PipelineRiverbanks").then(mod => ({ default: mod.PipelineRiverbanks })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current-500"></div>
    </div>
  )
});

export default function PipelinePage() {
  return (
    <AppShell
      title="Pipeline"
      subtitle="Riverbanks"
      showSearch={false}
      primaryAction={{
        label: "New Deal",
        onClick: () => console.log("New Deal clicked"),
        icon: <span className="text-lg">+</span>
      }}
    >
      <PipelineRiverbanks />
    </AppShell>
  );
}


