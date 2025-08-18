"use client";
import { useState, useEffect } from 'react';
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

const InboxMainCurrent = dynamic(() => import("@/components/app/InboxMainCurrent").then(mod => ({ default: mod.InboxMainCurrent })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current-500"></div>
    </div>
  )
});

export default function InboxPage() {
  return (
    <AppShell
      title="Inbox"
      subtitle="Main Current"
      showSearch={false}
      primaryAction={{
        label: "Compose",
        onClick: () => console.log("Compose clicked"),
        icon: <span className="text-lg">✏️</span>
      }}
    >
      <InboxMainCurrent />
    </AppShell>
  );
}


