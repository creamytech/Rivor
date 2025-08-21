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
  MessageSquare,
  LogOut,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import EnhancedSidebar from "./EnhancedSidebar";
import MobileNavigation from "./MobileNavigation";
import ChatAgent from "./ChatAgent";

type AppShellProps = {
  children: React.ReactNode;
  rightDrawer?: React.ReactNode;
};

export default function AppShell({ children, rightDrawer }: AppShellProps) {
  const { theme } = useTheme();
  const [showDrawer, setShowDrawer] = useState(Boolean(rightDrawer));
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showChatAgent, setShowChatAgent] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickActionsPosition, setQuickActionsPosition] = useState({ top: 0, left: 0 });
  const [notificationPosition, setNotificationPosition] = useState({ top: 0, right: 0 });
  const [profilePosition, setProfilePosition] = useState({ top: 0, right: 0 });
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);
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

  // Scroll-based blur enhancement
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Time-based adaptive colors
  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setTimeOfDay('morning');
      else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon');
      else if (hour >= 17 && hour < 21) setTimeOfDay('evening');
      else setTimeOfDay('night');
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Page transition animation
  useEffect(() => {
    setPageTransition(true);
    const timer = setTimeout(() => setPageTransition(false), 1500);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close quick actions if clicking outside
      if (showQuickActions && !target.closest('.glass-quick-dropdown') && !target.closest('.glass-plus-orb')) {
        setShowQuickActions(false);
      }
      
      // Close search results if clicking outside
      if (showSearchResults && !target.closest('.glass-search-results') && !target.closest('.glass-search-pill-enhanced')) {
        setShowSearchResults(false);
      }
      
      // Close notifications if clicking outside
      if (showNotifications && !target.closest('.glass-notification-preview') && !target.closest('[aria-label="Notifications"]')) {
        setShowNotifications(false);
      }
      
      // Close profile menu if clicking outside
      if (showUserProfile && !target.closest('.glass-profile-menu') && !target.closest('[aria-label="User profile"]')) {
        setShowUserProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showQuickActions, showSearchResults, showNotifications, showUserProfile]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const getUserInitials = () => {
    // This would come from session in a real app
    return "U";
  };

  const handleQuickActionsToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setQuickActionsPosition({
      top: rect.bottom + 8,
      left: rect.left
    });
    setShowQuickActions(!showQuickActions);
  };

  const handleNotificationToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setNotificationPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right
    });
    setShowNotifications(!showNotifications);
  };

  const handleProfileToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setProfilePosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right
    });
    setShowUserProfile(!showUserProfile);
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
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'} min-h-screen`}>
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
        <div className="absolute w-96 h-96 top-[10%] left-[20%] rounded-full glass-surface-subtle blur-3xl" />
        <div className="absolute w-64 h-64 top-[60%] right-[15%] rounded-full glass-surface-subtle blur-3xl" />
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation 
        isOpen={showMobileNav}
        onToggle={() => setShowMobileNav(!showMobileNav)}
      />

      {/* Desktop Layout - Seamless Connection */}
      <div 
        className={`hidden md:grid min-h-screen transition-all duration-200 ease-out relative z-10 ${
          isSidebarCollapsed ? 'grid-cols-[72px_1fr]' : 'grid-cols-[280px_1fr]'
        }`}
        style={{
          gap: '0',
          background: 'var(--glass-surface-subtle)',
          backdropFilter: 'blur(32px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.4)'
        }}
      >
        {/* Enhanced Sidebar */}
        <EnhancedSidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={toggleSidebar} 
        />
      
        {/* Main Content Area */}
        <div 
          className="grid grid-rows-[64px_1fr] min-h-screen relative z-30"
          style={{ 
            background: 'transparent',
            gap: '0'
          }}
        >
          <header 
            className={`glass-topbar-unified glass-topbar-highlights glass-topbar-scroll glass-topbar-shimmer glass-adaptive-surface sticky top-0 z-50 h-16 flex items-center ${
              isScrolled ? 'scrolled' : ''
            } ${timeOfDay ? `glass-adaptive-${timeOfDay}` : ''} ${pageTransition ? 'page-transition' : ''}`}
            style={{ 
              borderRadius: '0 !important',
              borderLeft: 'none',
              borderTop: 'none',
              borderRight: 'none',
              borderBottom: '1px solid var(--glass-border)',
              background: 'var(--glass-surface-subtle)',
              backdropFilter: 'blur(32px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
              boxShadow: 'inset 0 1px 0 var(--glass-highlight)'
            }}
          >
            {/* Ambient Background Orbs */}
            <div className="glass-ambient-orbs">
              <div className="glass-ambient-orb"></div>
              <div className="glass-ambient-orb"></div>
              <div className="glass-ambient-orb"></div>
            </div>
            <div className={`w-full flex items-center justify-between transition-all duration-300 relative z-10 ${
              isSidebarCollapsed ? 'px-3 md:px-4' : 'px-4 md:px-6'
            }`}>
              {/* Left Side: Glowing Plus Button for Quick Actions */}
              <div className="flex items-center gap-4">
                {/* Mobile Logo (hidden on desktop) */}
                <div className="md:hidden flex-shrink-0">
                  <Link href="/app" className="flex items-center gap-2" aria-label="Rivor dashboard">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg glass-droplet glass-logo-glow"
                      style={{ 
                        background: theme === 'black' 
                          ? 'linear-gradient(135deg, #ffffff, rgba(255,255,255,0.8))'
                          : 'linear-gradient(135deg, #000000, rgba(0,0,0,0.8))',
                        color: theme === 'black' ? '#000000' : '#ffffff'
                      }}
                    >
                      <span className="font-bold text-sm">R</span>
                    </div>
                  </Link>
                </div>

                {/* Glowing Plus Button */}
                <div className="hidden md:block relative">
                  <button 
                    className="glass-plus-orb"
                    onClick={handleQuickActionsToggle}
                    aria-label="Quick Actions Menu"
                  >
                    <Plus className="h-5 w-5" style={{ color: 'var(--glass-text)' }} />
                  </button>
                  
                </div>
              </div>

              {/* Center: Enhanced Search Bar with Smart Dropdown */}
              <div className={`hidden md:flex flex-1 justify-center transition-all duration-300 ${
                isSidebarCollapsed ? 'max-w-3xl' : 'max-w-2xl'
              }`}>
                <div className="relative w-full">
                  <div className="glass-search-pill-enhanced">
                    <Search 
                      className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 z-10"
                      style={{ color: 'var(--glass-text-muted)' }}
                    />
                    <input
                      type="text"
                      placeholder={isSidebarCollapsed ? "Search everything..." : "Search contacts, deals, emails, documents..."}
                      aria-label="Global search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSearchResults(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowSearchResults(searchQuery.length > 0 || true)} // Always show on focus for demo
                      onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                      className="w-full pl-16 pr-24 text-base bg-transparent border-none outline-none font-medium py-5"
                      style={{ 
                        color: 'var(--glass-text)',
                      }}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10">
                      <div 
                        className="text-xs px-3 py-2 rounded-xl font-semibold border backdrop-blur-sm transition-all duration-200 hover:scale-105"
                        style={{
                          background: 'var(--glass-surface-subtle)',
                          color: 'var(--glass-text-muted)',
                          borderColor: 'var(--glass-border)',
                          boxShadow: 'inset 0 1px 0 var(--glass-highlight), 0 2px 4px var(--glass-shadow)'
                        }}
                      >
                        ⌘K
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* Right Side: Frosted Capsule with System Controls */}
              <div className="glass-controls-capsule">
                {/* Sync Status */}
                <button
                  onClick={() => {
                    setSyncLoading(true);
                    setTimeout(() => setSyncLoading(false), 2000);
                  }}
                  className="glass-control-button glass-press-feedback"
                  title="Sync Status"
                >
                  {syncLoading ? (
                    <div className="glass-spinner-container">
                      <div className="glass-spinner w-4 h-4"></div>
                    </div>
                  ) : (
                    <div className="glass-sync-indicator connected"></div>
                  )}
                </button>

                {/* Notifications */}
                <div className="relative">
                  <button
                    className="glass-control-button glass-press-feedback"
                    onClick={handleNotificationToggle}
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
                    <div className="glass-notification-badge new">3</div>
                  </button>

                </div>

                {/* User Profile */}
                <div className="relative">
                  <button
                    className="glass-control-button glass-profile-orb"
                    onClick={handleProfileToggle}
                    aria-label="User profile"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback 
                        className="text-xs font-medium"
                        style={{ 
                          background: theme === 'black' 
                            ? 'linear-gradient(135deg, #ffffff, rgba(255,255,255,0.9))'
                            : 'linear-gradient(135deg, #000000, rgba(0,0,0,0.9))',
                          color: theme === 'black' ? '#000000' : '#ffffff',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className={`overflow-auto h-[calc(100vh-64px)] pb-16 md:pb-0 relative ${rightDrawer && showDrawer ? "pr-[360px]" : ""}`}>
            {children}
          </main>

          {/* Right Drawer */}
          {showDrawer && (
            <aside 
              className="glass-panel fixed right-0 top-16 w-[360px] h-[calc(100vh-64px)] border-l z-30 overflow-auto"
              style={{
                background: 'var(--glass-surface)',
                borderColor: 'var(--glass-border)',
                borderRadius: '0'
              }}
            >
              {rightDrawer}
            </aside>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header 
          className="glass-panel fixed top-0 left-0 right-0 z-40 h-16 flex items-center border-b"
          style={{ 
            background: 'var(--glass-surface)',
            borderBottomColor: 'var(--glass-border)',
            backdropFilter: 'blur(20px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
            borderRadius: '0',
            boxShadow: `0 1px 0 0 var(--glass-border)`
          }}
        >
          <div className="px-4 w-full flex items-center justify-between gap-4">
            {/* Mobile Logo */}
            <Link href="/app" className="flex items-center gap-2" aria-label="Rivor dashboard">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg glass-droplet"
                style={{ 
                  background: theme === 'black' 
                    ? 'linear-gradient(135deg, #ffffff, rgba(255,255,255,0.8))'
                    : 'linear-gradient(135deg, #000000, rgba(0,0,0,0.8))',
                  color: theme === 'black' ? '#000000' : '#ffffff'
                }}
              >
                <span className="font-bold text-sm">R</span>
              </div>
            </Link>
            
            {/* Mobile Actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setShowNotifications(true)}
              >
                <Bell className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setShowMobileNav(true)}
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="flex-1 overflow-auto pt-16 pb-20">
          {children}
        </main>
      </div>

      {/* Chat Agent */}
      <ChatAgent 
        isOpen={showChatAgent} 
        onClose={() => setShowChatAgent(false)} 
      />


      

      {/* Global Dropdowns - Outside header for proper z-index layering */}
      
      {/* Quick Actions Dropdown */}
      <div 
        className={`glass-quick-dropdown ${showQuickActions ? 'visible' : ''}`}
        style={{
          position: 'fixed',
          top: `${quickActionsPosition.top}px`,
          left: `${quickActionsPosition.left}px`,
          width: '280px'
        }}
      >
        <div className="space-y-2">
          <div className="glass-quick-action-item" onClick={() => { /* Add Contact */ setShowQuickActions(false); }}>
            <div className="glass-quick-action-icon">
              <User className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>Add Contact</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Create new contact</div>
            </div>
          </div>
          <div className="glass-quick-action-item" onClick={() => { /* New Listing */ setShowQuickActions(false); }}>
            <div className="glass-quick-action-icon">
              <Building2 className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>New Listing</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Add property listing</div>
            </div>
          </div>
          <div className="glass-quick-action-item" onClick={() => { /* Schedule Meeting */ setShowQuickActions(false); }}>
            <div className="glass-quick-action-icon">
              <Calendar className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>Schedule Meeting</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Book appointment</div>
            </div>
          </div>
          <div className="glass-quick-action-item" onClick={() => { /* Send Email */ setShowQuickActions(false); }}>
            <div className="glass-quick-action-icon">
              <MessageSquare className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>Send Email</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Compose message</div>
            </div>
          </div>
          <div className="glass-quick-action-item" onClick={() => { /* View Reports */ setShowQuickActions(false); }}>
            <div className="glass-quick-action-icon">
              <BarChart3 className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>View Reports</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Analytics dashboard</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results Dropdown */}
      <div className={`glass-search-results ${showSearchResults ? 'visible' : ''}`} style={{
        position: 'fixed',
        top: '76px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: isSidebarCollapsed ? '600px' : '500px',
        maxWidth: '90vw'
      }}>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg glass-hover-pulse">
            <User className="h-4 w-4" style={{ color: 'var(--glass-text-muted)' }} />
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>John Smith</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Contact • john@example.com</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg glass-hover-pulse">
            <Building2 className="h-4 w-4" style={{ color: 'var(--glass-text-muted)' }} />
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>Maple Street Property</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Listing • $450,000</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg glass-hover-pulse">
            <MessageSquare className="h-4 w-4" style={{ color: 'var(--glass-text-muted)' }} />
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>Email: Property Viewing</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Inbox • 2 hours ago</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Dropdown */}
      <div className={`glass-notification-preview ${showNotifications ? 'visible' : ''}`} style={{
        position: 'fixed',
        top: `${notificationPosition.top}px`,
        right: `${notificationPosition.right}px`,
        width: '320px'
      }}>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-2 rounded-lg glass-hover-pulse">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>New deal added</p>
              <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Sarah Johnson - $250K</p>
            </div>
            <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>2m</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg glass-hover-pulse">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>Meeting confirmed</p>
              <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Property viewing at 3 PM</p>
            </div>
            <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>5m</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg glass-hover-pulse">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>Document signed</p>
              <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Contract for Maple St</p>
            </div>
            <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>1h</span>
          </div>
        </div>
      </div>

      {/* Profile Dropdown */}
      <div className={`glass-profile-menu ${showUserProfile ? 'visible' : ''}`} style={{
        position: 'fixed',
        top: `${profilePosition.top}px`,
        right: `${profilePosition.right}px`,
        width: '240px'
      }}>
        <div className="space-y-1">
          <a href="#" className="glass-profile-menu-item">
            <User className="h-4 w-4" />
            <span>View Profile</span>
          </a>
          <a href="#" className="glass-profile-menu-item">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </a>
          <a href="#" className="glass-profile-menu-item">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </a>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2 opacity-20"></div>
          <a href="#" className="glass-profile-menu-item text-red-500">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </a>
        </div>
      </div>

      <Toaster />
    </div>
  );
}