"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/branding/Logo";
import { useEffect, useState } from "react";

type AppShellProps = {
  children: React.ReactNode;
  rightDrawer?: React.ReactNode;
};

const nav = [
  { href: "/app/inbox", label: "Inbox", icon: "📥" },
  { href: "/app/pipeline", label: "Pipeline", icon: "🗂️" },
  { href: "/app/leads/1", label: "Leads", icon: "👤" },
  { href: "/app/calendar", label: "Calendar", icon: "🗓️" },
  { href: "/app/tasks", label: "Tasks", icon: "✅" },
  { href: "/app/analytics", label: "Analytics", icon: "📊" },
  { href: "/app/search", label: "Search", icon: "🔎" },
  { href: "/app/notifications", label: "Notifs", icon: "🔔" },
  { href: "/app/settings", label: "Settings", icon: "⚙️" },
];

export default function AppShell({ children, rightDrawer }: AppShellProps) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [showDrawer, setShowDrawer] = useState(Boolean(rightDrawer));
  useEffect(() => setShowDrawer(Boolean(rightDrawer)), [rightDrawer]);

  return (
    <div className="grid grid-cols-[64px_1fr] md:grid-cols-[240px_1fr] min-h-screen">
      <aside className="sticky top-0 h-screen hidden md:flex md:flex-col border-r border-[var(--border)] bg-[var(--muted)]">
        <div className="h-14 flex items-center px-4 border-b border-[var(--border)]">
          <Logo href="/app/inbox" />
        </div>
        <nav className="flex-1 py-4">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-[var(--background)] ${active ? "bg-[var(--background)]" : ""}`}>
                <span aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="grid grid-rows-[56px_1fr]">
        <header className="sticky top-0 z-30 h-14 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)92%,transparent)] backdrop-blur flex items-center">
          <div className="px-3 md:px-4 w-full flex items-center gap-2">
            <div className="md:hidden"><Logo href="/app/inbox" variant="mark" /></div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--muted)] text-sm"
            />
            <Link href="/app/help" className="px-2 py-1.5 text-sm border border-[var(--border)] rounded-md">Help</Link>
            <Link href="/app/settings" className="ml-1 w-8 h-8 rounded-full bg-[var(--muted)] border border-[var(--border)] grid place-items-center" aria-label="User menu">👤</Link>
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
    </div>
  );
}


