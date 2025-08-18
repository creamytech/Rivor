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

const SettingsLocksDams = dynamic(() => import("@/components/app/SettingsLocksDams").then(mod => ({ default: mod.SettingsLocksDams })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current-500"></div>
    </div>
  )
});

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      subtitle="Locks & Dams"
      showSearch={false}
    >
      <SettingsLocksDams />
    </AppShell>
  );
}