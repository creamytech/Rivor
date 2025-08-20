"use client";

import React from "react";
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
  TrendingUp,
  Plus,
  Edit3,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import EnhancedSidebar from "./EnhancedSidebar";
import MobileNavigation from "./MobileNavigation";
import ChatAgent from "./ChatAgent";
import NotificationsPanel from "./NotificationsPanel";
import UserProfileDropdown from "./UserProfileDropdown";
import QuickActionsMenu from "./QuickActionsMenu";

type AppShellProps = {
  children: React.ReactNode;
  rightDrawer?: React.ReactNode;
};

export default function AppShell({ children, rightDrawer }: AppShellProps) {
  const { currentTheme } = useTheme();
  const [showDrawer, setShowDrawer] = useState(Boolean(rightDrawer));
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showChatAgent, setShowChatAgent] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  const mobileNavItems = [
    { href: "/app", label: "Dashboard", icon: BarChart3 },
    { href: "/app/properties", label: "Properties", icon: Building2 },
    { href: "/app/showings", label: "Showings", icon: Calendar },
    { href: "/app/insights", label: "Insights", icon: TrendingUp }
  ];
  
  useEffect(() => setShowDrawer(Boolean(rightDrawer)), [rightDrawer]);

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickActions(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowQuickActions(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Chat Agent event listener
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

  // Get contextual page info and creation CTA
  const getPageContext = () => {
    if (pathname.includes('/inbox')) {
      return {
        icon: MessageSquare,
        title: 'Inbox',
        subtitle: 'AI-Powered Email Management',
        ctaText: 'Compose',
        ctaIcon: Edit3,
        ctaAction: () => {
          // Trigger compose modal or navigate to compose
          console.log('Compose email');
        }
      };
    }
    if (pathname.includes('/contacts')) {
      return {
        icon: User,
        title: 'Contacts',
        subtitle: 'Customer Relationship Management', 
        ctaText: 'Add Contact',
        ctaIcon: Plus,
        ctaAction: () => setShowQuickActions(true)
      };
    }
    if (pathname.includes('/pipeline')) {
      return {
        icon: TrendingUp,
        title: 'Pipeline',
        subtitle: 'Deal Management & Sales Tracking',
        ctaText: 'New Deal',
        ctaIcon: Plus, 
        ctaAction: () => setShowQuickActions(true)
      };
    }
    // Default dashboard
    return {
      icon: BarChart3,
      title: 'Dashboard',
      subtitle: 'Real Estate CRM',
      ctaText: 'Quick Actions',
      ctaIcon: Plus,
      ctaAction: () => setShowQuickActions(true)
    };
  };

  const pageContext = getPageContext();

  return (
    <div>
      {/* Mobile Navigation */}
      <MobileNavigation 
        isOpen={showMobileNav}
        onToggle={() => setShowMobileNav(!showMobileNav)}
      />

      {/* Desktop Layout */}
      <div className={`hidden md:grid min-h-screen transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'grid-cols-[72px_1fr]' : 'grid-cols-[256px_1fr]'
      }`}>
        {/* Enhanced Sidebar */}
        <EnhancedSidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={toggleSidebar} 
        />
      
        {/* Main Content Area */}
        <div className="grid grid-rows-[56px_1fr]">
          <header 
            className="sticky top-0 z-50 h-16 backdrop-blur-xl shadow-sm flex items-center border-b"
            style={{ 
              backgroundColor: `${currentTheme.colors.surfaceAlt}F5`,
              borderBottomColor: currentTheme.colors.border,
              boxShadow: `0 1px 0 0 ${currentTheme.colors.border}40`
            }}
          >
            <div className="px-4 md:px-6 w-full flex items-center justify-between gap-4">
              {/* Left Side: Mobile Logo + Breadcrumbs */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Mobile Logo (hidden on desktop) */}
                <div className="md:hidden flex-shrink-0">
                  <Link href="/app" className="flex items-center gap-2" aria-label="Rivor dashboard">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})` }}
                    >
                      <span className="text-white font-bold text-sm">R</span>
                    </div>
                  </Link>
                </div>

                {/* Dynamic Breadcrumbs - truncate gracefully */}
                <div className="hidden md:flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <pageContext.icon 
                      className="h-5 w-5 flex-shrink-0" 
                      style={{ color: currentTheme.colors.primary }}
                    />
                    <span 
                      className="text-lg font-semibold truncate"
                      style={{ color: currentTheme.colors.textOnSurfaceAlt }}
                    >
                      {pageContext.title}
                    </span>
                  </div>
                  <div 
                    className="h-4 w-px flex-shrink-0"
                    style={{ backgroundColor: currentTheme.colors.border }}
                  />
                  <div 
                    className="text-sm truncate"
                    style={{ color: currentTheme.colors.textMuted }}
                  >
                    {pageContext.subtitle}
                  </div>
                </div>
              </div>

              {/* Center: Hero Search */}
              <div className="hidden md:flex flex-1 max-w-md mx-4">
                <div className="relative w-full">
                  <Search 
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: currentTheme.colors.textMuted }}
                  />
                  <input
                    type="text"
                    placeholder="Search contacts, deals, emails..."
                    aria-label="Global search"
                    className="w-full pl-12 pr-16 py-2.5 text-sm rounded-xl border-2 focus:outline-none focus:border-opacity-100 transition-all cursor-pointer hover:border-opacity-80 shadow-sm font-medium"
                    style={{ 
                      backgroundColor: currentTheme.colors.surface,
                      color: currentTheme.colors.textOnSurface,
                      borderColor: `${currentTheme.colors.border}80`,
                      '--tw-ring-color': currentTheme.colors.primary
                    } as any}
                    onClick={() => setShowQuickActions(true)}
                    readOnly
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div 
                      className="text-xs px-1.5 py-0.5 rounded font-medium border"
                      style={{
                        backgroundColor: currentTheme.colors.backgroundSecondary,
                        color: currentTheme.colors.textMuted,
                        borderColor: currentTheme.colors.border
                      }}
                    >
                      ⌘K
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Navigation Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Adaptive Creation Button - contextual per page */}
                {(isSidebarCollapsed || isMobile) && (
                  <Button 
                    variant="default"
                    size="sm"
                    className="h-9 px-3 gap-1.5 bg-gradient-to-r shadow-sm hover:shadow-md transition-all"
                    onClick={pageContext.ctaAction}
                    aria-label={pageContext.ctaText}
                    style={{ 
                      background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`,
                      color: currentTheme.colors.textInverse
                    }}
                  >
                    <pageContext.ctaIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{pageContext.ctaText}</span>
                  </Button>
                )}

                {/* Connection Status Indicator */}
                <div 
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    borderColor: currentTheme.colors.border,
                    color: currentTheme.colors.textMuted
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: currentTheme.colors.success }}
                  />
                  <span>Synced</span>
                </div>

                {/* Notifications with improved indicator */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative h-9 w-9 rounded-lg border hover:shadow-sm transition-all"
                    onClick={() => setShowNotifications(true)}
                    aria-label="Notifications (3 unread)"
                    style={{ 
                      color: currentTheme.colors.textOnSurfaceAlt,
                      borderColor: `${currentTheme.colors.border}60`,
                      backgroundColor: showNotifications ? currentTheme.colors.surfaceAlt : 'transparent'
                    }}
                  >
                    <Bell className="h-4 w-4" />
                    <span 
                      className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center text-xs font-bold ring-2"
                      style={{ 
                        backgroundColor: currentTheme.colors.error,
                        color: currentTheme.colors.textInverse,
                        ringColor: currentTheme.colors.surfaceAlt
                      }}
                    >
                      3
                    </span>
                  </Button>
                </div>

                {/* Help */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 hidden lg:flex rounded-lg border hover:shadow-sm transition-all"
                  aria-label="Help"
                  style={{ 
                    color: currentTheme.colors.textOnSurfaceAlt,
                    borderColor: `${currentTheme.colors.border}60`
                  }}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>

                {/* User Profile */}
                <Button
                  variant="ghost"
                  className="h-9 px-2.5 gap-2 hidden lg:flex rounded-lg border hover:shadow-sm transition-all"
                  onClick={() => setShowUserProfile(true)}
                  aria-label="User profile"
                  style={{ 
                    color: currentTheme.colors.textOnSurfaceAlt,
                    borderColor: `${currentTheme.colors.border}60`,
                    backgroundColor: showUserProfile ? currentTheme.colors.surfaceAlt : 'transparent'
                  }}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback 
                      className="text-white text-xs font-medium"
                      style={{ background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})` }}
                    >
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className={`overflow-auto h-[calc(100vh-64px)] pb-16 md:pb-0 ${rightDrawer ? "md:mr-[360px]" : ""}`}>
            {children}
          </main>

          {/* Right Drawer */}
          <aside className={`fixed md:static right-0 top-14 md:top-0 w-[360px] h-[calc(100vh-56px)] md:h-full border-l border-[var(--border)] bg-[var(--muted)] ${showDrawer ? "" : "hidden"}`}>
            {rightDrawer}
          </aside>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen flex flex-col pt-14 pb-20">
        {/* Mobile Content */}
        <main className="flex-1 overflow-auto h-[calc(100vh-140px)]">
          {children}
        </main>
      </div>

      {/* Chat Agent */}
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

      <Toaster />
    </div>
  );
}