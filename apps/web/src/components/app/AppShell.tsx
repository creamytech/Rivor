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
        <header className="sticky top-0 z-50 h-16 border-b border-border/50 bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-xl shadow-sm flex items-center">
          <div className="px-4 md:px-6 w-full flex items-center gap-4">
            {/* Mobile Logo (hidden on desktop) */}
            <div className="md:hidden">
              <Link href="/app" className="flex items-center gap-2" aria-label="Rivor dashboard">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
              </Link>
            </div>

            {/* Enhanced Breadcrumb / Page Title */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <span className="text-lg font-semibold text-foreground">Dashboard</span>
              </div>
              <div className="h-4 w-px bg-border/50"></div>
              <div className="text-sm text-muted-foreground">Real Estate CRM</div>
            </div>

            {/* Enhanced Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full flex items-center">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search properties, leads, contacts..."
                  aria-label="Search"
                  className="w-full pl-12 pr-12 py-3 text-sm bg-background/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 focus:bg-background transition-all cursor-pointer hover:border-border shadow-sm"
                  onClick={() => setShowQuickActions(true)}
                  readOnly
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <div className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground font-medium border border-border/50">
                    ⌘K
                  </div>
                </div>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Chat Agent Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChatAgent(true)}
                aria-label="Help & Chat Agent"
                className="relative flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition-all duration-200"
              >
                <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-blue-600" />
              </Button>

              {/* Notifications Button */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                  className="relative flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-950/50 rounded-xl transition-all duration-200"
                >
                  <Bell className="h-5 w-5 text-muted-foreground hover:text-orange-600" />
                  {/* Enhanced notification badge */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full border-2 border-background shadow-sm animate-pulse"></div>
                </Button>
              </div>

              {/* Enhanced User Profile Button */}
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowUserProfile(!showUserProfile)}
                  aria-label="User menu"
                  className="flex items-center gap-3 px-3 py-2 h-auto hover:bg-muted/50 rounded-xl transition-all duration-200"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-border/50">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white text-sm font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
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


