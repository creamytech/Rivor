"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Bell, HelpCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import EnhancedSidebar from "./EnhancedSidebar";

type AppShellProps = {
  children: React.ReactNode;
  rightDrawer?: React.ReactNode;
};

export default function AppShell({ children, rightDrawer }: AppShellProps) {
  const [showDrawer, setShowDrawer] = useState(Boolean(rightDrawer));
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  useEffect(() => setShowDrawer(Boolean(rightDrawer)), [rightDrawer]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={`grid min-h-screen transition-all duration-300 ease-in-out ${
      isSidebarCollapsed ? 'grid-cols-[64px_1fr]' : 'grid-cols-[256px_1fr]'
    }`}>
      {/* Enhanced Sidebar */}
      <EnhancedSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={toggleSidebar} 
      />
      
      {/* Main Content Area */}
      <div className="grid grid-rows-[56px_1fr]">
        <header className="sticky top-0 z-50 h-14 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)95%,transparent)] backdrop-blur flex items-center">
          <div className="px-3 md:px-4 w-full flex items-center gap-3">
            {/* Mobile Logo (hidden on desktop) */}
            <div className="md:hidden">
              <Link href="/app" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
              </Link>
            </div>
            
            {/* Sticky Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Search leads, emails, or run commands..."
                  className="w-full pl-9 pr-8 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-[var(--border)] px-1.5 py-0.5 rounded text-[var(--muted-foreground)]">
                  ⌘K
                </div>
              </div>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-1 ml-auto">
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
          <main className={`h-full ${rightDrawer ? "md:mr-[360px]" : ""}`}>
            {children}
          </main>
          {rightDrawer ? (
            <aside className={`fixed md:static right-0 top-14 md:top-0 w-[360px] h-[calc(100vh-56px)] md:h-full border-l border-[var(--border)] bg-[var(--muted)] ${showDrawer ? "" : "hidden"}`}>
              {rightDrawer}
            </aside>
          ) : null}
        </div>
      </div>
      
      {/* Command Palette */}
      {/* <EnhancedCommandPalette isOpen={showCommandPalette} setIsOpen={setShowCommandPalette} /> */}
      <Toaster />
    </div>
  );
}


