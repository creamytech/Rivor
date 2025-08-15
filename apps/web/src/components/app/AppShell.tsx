"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/branding/Logo";
import EnhancedCommandPalette from "@/components/app/EnhancedCommandPalette";
import { useEffect, useState } from "react";
import { Search, Bell, HelpCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  children: React.ReactNode;
  rightDrawer?: React.ReactNode;
};

const nav = [
  { href: "/app", label: "App", icon: "📊", exactMatch: true },
  { href: "/app/inbox", label: "Inbox", icon: "📥" },
  { href: "/app/pipeline", label: "Pipeline", icon: "🗂️" },
  { href: "/app/calendar", label: "Calendar", icon: "🗓️" },
  { href: "/app/contacts", label: "Contacts", icon: "👤" },
  { href: "/app/chat", label: "Chat", icon: "💬" },
  { href: "/app/settings", label: "Settings", icon: "⚙️" },
];

export default function AppShell({ children, rightDrawer }: AppShellProps) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [showDrawer, setShowDrawer] = useState(Boolean(rightDrawer));
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  useEffect(() => setShowDrawer(Boolean(rightDrawer)), [rightDrawer]);
  


  return (
    <div className="grid grid-cols-[64px_1fr] md:grid-cols-[240px_1fr] min-h-screen">
      <aside className="sticky top-0 h-screen hidden md:flex md:flex-col border-r border-[var(--border)] bg-[var(--muted)]">
        <div className="h-14 flex items-center px-4 border-b border-[var(--border)]">
          <Logo href="/app/inbox" />
        </div>
        <nav className="flex-1 py-4">
          {nav.map((item) => {
            const active = item.exactMatch 
              ? pathname === item.href 
              : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-[var(--background)] transition-colors rounded-md mx-2 ${active ? "bg-[var(--background)] text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>
                <span aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-xs px-1.5 py-0.5 bg-[var(--rivor-teal)] text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="grid grid-rows-[56px_1fr]">
        <header className="sticky top-0 z-30 h-14 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)92%,transparent)] backdrop-blur flex items-center">
          <div className="px-3 md:px-4 w-full flex items-center gap-3">
            <div className="md:hidden"><Logo href="/app/inbox" size="sm" /></div>
            
            {/* Command Palette Trigger */}
            <div className="flex-1 relative">
              <button
                onClick={() => setShowCommandPalette(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--muted)] text-sm text-[var(--muted-foreground)] hover:bg-[var(--background)] transition-colors"
              >
                <Search className="h-4 w-4" />
                <span>Search or run a command...</span>
                <div className="ml-auto text-xs bg-[var(--border)] px-1.5 py-0.5 rounded">
                  ⌘K
                </div>
              </button>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/app/help" aria-label="Help">
                  <HelpCircle className="h-4 w-4" />
                </Link>
              </Button>
              
              <Button variant="ghost" size="icon" asChild>
                <Link href="/app/notifications" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </Link>
              </Button>
              
              <Button variant="ghost" size="icon" asChild>
                <Link href="/app/settings" aria-label="User menu">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </header>
        <div className="relative">
          <main className={`h-full ${rightDrawer ? "md:mr-[360px]" : ""}`}>{children}</main>
          {rightDrawer ? (
            <aside className={`fixed md:static right-0 top-14 md:top-0 w-[360px] h-[calc(100vh-56px)] md:h-full border-l border-[var(--border)] bg-[var(--muted)] ${showDrawer ? "" : "hidden"}`}>
              {rightDrawer}
            </aside>
          ) : null}
        </div>
      </div>
      
      {/* Command Palette */}
      <EnhancedCommandPalette isOpen={showCommandPalette} setIsOpen={setShowCommandPalette} />
    </div>
  );
}


