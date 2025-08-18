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

const ChatGuide = dynamic(() => import("@/components/app/ChatGuide").then(mod => ({ default: mod.ChatGuide })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current-500"></div>
    </div>
  )
});

export default function ChatPage() {
  return (
    <AppShell
      title="Chat"
      subtitle="Guide"
      showSearch={false}
    >
      <ChatGuide />
    </AppShell>
  );
}
