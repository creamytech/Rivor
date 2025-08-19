"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  HelpCircle,
  User,
  ChevronDown,
  BarChart3,
  Building2,
  Calendar,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EnhancedSidebar from "./EnhancedSidebar";
import ChatAgent from "./ChatAgent";
import NotificationsPanel from "./NotificationsPanel";
import UserProfileDropdown from "./UserProfileDropdown";
import QuickActionsMenu from "./QuickActionsMenu";

type AppShellProps = {
  children: React.ReactNode;
  rightDrawer?: React.ReactNode;
};

export default function AppShell({ children, rightDrawer }: AppShellProps) {
  const [showDrawer, setShowDrawer] = useState(Boolean(rightDrawer));
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showChatAgent, setShowChatAgent] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const pathname = usePathname();

  const mobileNavItems = [
    { href: "/app", label: "Dashboard", icon: BarChart3 },
    { href: "/app/properties", label: "Properties", icon: Building2 },
    { href: "/app/showings", label: "Showings", icon: Calendar },
    { href: "/app/insights", label: "Insights", icon: TrendingUp }
  ];
  
  useEffect(() => setShowDrawer(Boolean(rightDrawer)), [rightDrawer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for quick actions
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickActions(true);
      }
      
      // Cmd/Ctrl + H for help
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        setShowChatAgent(true);
      }
      
      // Cmd/Ctrl + N for notifications
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setShowNotifications(!showNotifications);
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowQuickActions(false);
        setShowChatAgent(false);
        setShowNotifications(false);
        setShowUserProfile(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showNotifications]);

  useEffect(() => {
    const handler = () => setShowChatAgent(true);
    window.addEventListener('chat-agent:open', handler);
    return () => window.removeEventListener('chat-agent:open', handler);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const getUserInitials = () => {
    // This would come from session in a real app
    return "U";
  };

  return (
    <div className={`grid min-h-screen transition-all duration-300 ease-in-out ${
      isSidebarCollapsed ? 'grid-cols-[72px_1fr]' : 'grid-cols-[256px_1fr]'
    }`}>
      {/* Enhanced Sidebar */}
      <EnhancedSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={toggleSidebar} 
      />
      
      {/* Main Content Area */}
      <div className="grid grid-rows-[56px_1fr]">
        <header className="sticky top-0 z-50 h-14 border-b border-[var(--border)] bg-gradient-to-r from-teal-500/80 to-azure-500/80 backdrop-blur flex items-center">
          <div className="px-4 md:px-6 w-full flex items-center gap-4">
            {/* Mobile Logo (hidden on desktop) */}
            <div className="md:hidden">
              <Link href="/app" className="flex items-center gap-2" aria-label="Rivor dashboard">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
              </Link>
            </div>

            {/* Breadcrumb / Page Title Placeholder */}
            <div className="hidden md:block text-sm font-medium text-[var(--foreground)]">Page Title</div>

            {/* Sticky Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <div className="relative w-full flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Search leads, emails, or run commands..."
                  aria-label="Search"
                  className="w-full pl-9 pr-8 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  onClick={() => setShowQuickActions(true)}
                  readOnly
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-[var(--border)] px-1.5 py-0.5 rounded text-[var(--muted-foreground)]">
                  ⌘K
                </div>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Chat Agent Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChatAgent(true)}
                aria-label="Help & Chat Agent"
                className="relative flex items-center justify-center"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>

              {/* Notifications Button */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                  className="relative flex items-center justify-center"
                >
                  <Bell className="h-4 w-4" />
                  {/* Notification badge */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </Button>
              </div>

              {/* User Profile Button */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowUserProfile(!showUserProfile)}
                  aria-label="User menu"
                  className="flex items-center gap-2 px-2"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        <div className="relative">
          <main className={`h-full pb-16 md:pb-0 ${rightDrawer ? "md:mr-[360px]" : ""}`}>
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
      
      {/* Chat Agent Modal */}
      <ChatAgent 
        isOpen={showChatAgent} 
        onClose={() => setShowChatAgent(false)} 
      />
      
      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
      
      {/* User Profile Dropdown */}
      <UserProfileDropdown 
        isOpen={showUserProfile} 
        onClose={() => setShowUserProfile(false)} 
      />
      
      {/* Quick Actions Menu */}
      <QuickActionsMenu
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
      />

      {/* Mobile Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-[var(--border)] bg-[var(--muted)]"
        aria-label="Primary"
      >
        {mobileNavItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center flex-1 py-2 ${
                active
                  ? "text-blue-600"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Toaster />
    </div>
  );
}


