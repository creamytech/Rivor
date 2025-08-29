"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Settings,
  Home,
  FileText,
  UserPlus,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { SearchModal } from './SearchModal';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import EnhancedSidebar from "./EnhancedSidebar";
import MobileShell from "./MobileShell";
import ChatAgent from "./ChatAgent";
import ComposeEmailModal from "@/components/inbox/ComposeEmailModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { signOut, useSession } from "next-auth/react";
import dynamic from "next/dynamic";

// Dynamic imports for modal components
const CreateLeadModal = dynamic(() => import("@/components/pipeline/CreateLeadModal"), { ssr: false });
const CreateEventModal = dynamic(() => import("@/components/calendar/CreateEventModal"), { ssr: false });
const CreateTaskModal = dynamic(() => import("@/components/tasks/CreateTaskModal"), { ssr: false });

type AppShellProps = {
  children: React.ReactNode;
  rightDrawer?: React.ReactNode;
};

export default function AppShell({ children, rightDrawer }: AppShellProps) {
  const { theme } = useTheme();
  const [showDrawer, setShowDrawer] = useState(Boolean(rightDrawer));
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [showChatAgent, setShowChatAgent] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [contactFormData, setContactFormData] = useState({ name: '', email: '', phone: '', company: '', title: '', location: '', tags: [], notes: '' });
  const [listingFormData, setListingFormData] = useState({ address: '', price: '', beds: '', baths: '', sqft: '', description: '' });
  const [meetingFormData, setMeetingFormData] = useState({ title: '', date: '', time: '', attendees: '', notes: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [quickActionsPosition, setQuickActionsPosition] = useState({ top: 0, left: 0 });
  const [notificationPosition, setNotificationPosition] = useState({ top: 0, right: 0 });
  const [profilePosition, setProfilePosition] = useState({ top: 0, right: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showCreateContactModal, setShowCreateContactModal] = useState(false);
  const [showCreateListingModal, setShowCreateListingModal] = useState(false);
  const [showScheduleMeetingModal, setShowScheduleMeetingModal] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Apply dashboard modal blur effects when any modal is open
  useEffect(() => {
    const isDashboardModalOpen = showCreateContactModal || showCreateListingModal || showScheduleMeetingModal || showComposeModal || showCreateLeadModal || showCreateTaskModal;
    
    if (isDashboardModalOpen) {
      document.body.classList.add('dashboard-modal-open');
    } else {
      document.body.classList.remove('dashboard-modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('dashboard-modal-open');
    };
  }, [showCreateContactModal, showCreateListingModal, showScheduleMeetingModal, showComposeModal, showCreateLeadModal, showCreateTaskModal]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications with real-time SSE updates
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || data);
          // Count unread notifications
          const unread = (data.notifications || data).filter((notif: any) => !notif.isRead).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    // Initial fetch
    fetchNotifications();
    
    // Set up SSE connection for real-time notifications
    const eventSource = new EventSource('/api/notifications/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log('Real-time notification received:', notification);
        
        // Add new notification to the list
        setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
        
        // Update unread count
        if (!notification.isRead) {
          setUnreadCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Failed to parse SSE notification:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Fallback to polling if SSE fails
      const fallbackInterval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(fallbackInterval);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const pathname = usePathname();
  const router = useRouter();

  
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
  }, [showQuickActions, showNotifications, showUserProfile]);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setShowSearchModal(true);
      }
      if (event.key === 'Escape' && showSearchModal) {
        setShowSearchModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchModal]);

  const toggleSidebar = () => {
    const newCollapsedState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsedState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsedState));
  };

  const { data: session } = useSession();

  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    }
    if (session?.user?.email) {
      return session.user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const handleQuickActionsToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('Plus button clicked, current showQuickActions:', showQuickActions);
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setQuickActionsPosition({
      top: rect.bottom + 8,
      left: rect.left
    });
    setShowQuickActions(!showQuickActions);
    console.log('Setting showQuickActions to:', !showQuickActions);
  };

  const handleNotificationToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setNotificationPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right
    });
    
    const wasNotificationsPanelClosed = !showNotifications;
    setShowNotifications(!showNotifications);
    
    // If opening the notifications panel, mark all as read and clear the count
    if (wasNotificationsPanelClosed && unreadCount > 0) {
      try {
        const response = await fetch('/api/notifications/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          setUnreadCount(0);
          console.log('Notifications marked as read');
        }
      } catch (error) {
        console.error('Failed to mark notifications as read:', error);
      }
    }
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

  // Check if any modal is open
  const isAnyModalOpen = showComposeModal || showCreateContactModal || showCreateListingModal || showScheduleMeetingModal || showCreateLeadModal || showCreateTaskModal;

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'} min-h-screen`}>
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
        <div className="absolute w-96 h-96 top-[10%] left-[20%] rounded-full glass-surface-subtle blur-3xl" />
        <div className="absolute w-64 h-64 top-[60%] right-[15%] rounded-full glass-surface-subtle blur-3xl" />
      </div>


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

              {/* Center: AI-Powered Search Button */}
              <div className={`hidden md:flex flex-1 justify-center transition-all duration-300 ${
                isSidebarCollapsed ? 'max-w-3xl' : 'max-w-2xl'
              }`}>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="glass-search-pill-enhanced flex items-center gap-3 hover:scale-105 transition-all duration-200 cursor-pointer group"
                  style={{ 
                    minWidth: '400px',
                    padding: '12px 24px'
                  }}
                >
                  <Search className="h-5 w-5" style={{ color: 'var(--glass-text-muted)' }} />
                  <span className="text-base font-medium" style={{ color: 'var(--glass-text-muted)' }}>
                    Search everything...
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="px-2 py-1 rounded-md text-xs font-medium" style={{ 
                      background: 'var(--glass-bg-secondary)', 
                      color: 'var(--glass-text-muted)' 
                    }}>
                      ⌘K
                    </div>
                  </div>
                </button>
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
                    {unreadCount > 0 && (
                      <div className="glass-notification-badge new">{unreadCount}</div>
                    )}
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
                      <AvatarImage 
                        src={session?.user?.image || undefined}
                        alt={session?.user?.name || 'User avatar'}
                      />
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
      <div className="md:hidden">
        <MobileShell>
          {children}
        </MobileShell>
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
          <div className="glass-quick-action-item" onClick={() => { console.log('Contact modal clicked'); setShowCreateContactModal(true); setShowQuickActions(false); }}>
            <div className="glass-quick-action-icon">
              <User className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>Add Contact</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Create new contact</div>
            </div>
          </div>
          <div className="glass-quick-action-item" onClick={() => { console.log('Listing modal clicked'); setShowCreateListingModal(true); setShowQuickActions(false); }}>
            <div className="glass-quick-action-icon">
              <Building2 className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>New Listing</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Add property listing</div>
            </div>
          </div>
          <div className="glass-quick-action-item" onClick={() => { console.log('Meeting modal clicked'); setShowScheduleMeetingModal(true); setShowQuickActions(false); }}>
            <div className="glass-quick-action-icon">
              <Calendar className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>Schedule Meeting</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Book appointment</div>
            </div>
          </div>
          <div className="glass-quick-action-item" onClick={() => { 
             
            setShowComposeModal(true); 
            setShowQuickActions(false); 
          }}>
            <div className="glass-quick-action-icon">
              <MessageSquare className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>Send Email</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Compose message</div>
            </div>
          </div>
          <div className="glass-quick-action-item" onClick={() => { console.log('Lead modal clicked'); setShowCreateLeadModal(true); setShowQuickActions(false); }}>
            <div className="glass-quick-action-icon">
              <UserPlus className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>Add Lead</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Create new lead</div>
            </div>
          </div>
          <div className="glass-quick-action-item" onClick={() => { console.log('Task modal clicked'); setShowCreateTaskModal(true); setShowQuickActions(false); }}>
            <div className="glass-quick-action-icon">
              <Clock className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>Create Task</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Add new task</div>
            </div>
          </div>
          <Link href="/app/reporting" className="glass-quick-action-item" onClick={() => setShowQuickActions(false)}>
            <div className="glass-quick-action-icon">
              <BarChart3 className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>View Reports</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Analytics dashboard</div>
            </div>
          </Link>
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
          {notifications.length > 0 && (
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-sm font-medium" style={{ color: 'var(--glass-text)' }}>
                Notifications ({notifications.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/notifications/clear', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (response.ok) {
                      setNotifications([]);
                      setUnreadCount(0);
                    }
                  } catch (error) {
                    console.error('Failed to clear notifications:', error);
                  }
                }}
                className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
                style={{ color: 'var(--glass-text-muted)' }}
              >
                Clear All
              </Button>
            </div>
          )}
          {notifications.length > 0 ? (
            notifications.slice(0, 5).map((notification: any) => {
              const getNotificationColor = (type: string, priority: string) => {
                if (priority === 'high') return 'bg-red-500';
                if (priority === 'medium') return 'bg-orange-500';
                switch (type) {
                  case 'lead': return 'bg-blue-500';
                  case 'email': return 'bg-purple-500';
                  case 'meeting': return 'bg-green-500';
                  case 'task': return 'bg-yellow-500';
                  case 'integration': return 'bg-indigo-500';
                  case 'system': return 'bg-gray-500';
                  default: return 'bg-blue-500';
                }
              };
              
              const getTimeAgo = (timestamp: string) => {
                const now = new Date();
                const time = new Date(timestamp);
                const diffMs = now.getTime() - time.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);
                
                if (diffMins < 1) return 'now';
                if (diffMins < 60) return `${diffMins}m`;
                if (diffHours < 24) return `${diffHours}h`;
                return `${diffDays}d`;
              };
              
              const handleNotificationClick = () => {
                if (notification.actionUrl) {
                  router.push(notification.actionUrl);
                  setShowNotifications(false);
                } else {
                  // Fallback navigation based on type
                  switch (notification.type) {
                    case 'lead':
                    case 'email':
                    case 'draft':
                      router.push('/app/inbox');
                      break;
                    case 'meeting':
                      router.push('/app/calendar');
                      break;
                    case 'task':
                      router.push('/app/tasks');
                      break;
                    default:
                      router.push('/app');
                  }
                  setShowNotifications(false);
                }
              };

              return (
                <div 
                  key={notification.id} 
                  className="flex items-center gap-3 p-2 rounded-lg glass-hover-pulse cursor-pointer transition-all duration-200 hover:bg-white/5"
                  onClick={handleNotificationClick}
                >
                  <div className={`w-2 h-2 rounded-full ${getNotificationColor(notification.type, notification.priority)}`}></div>
                  <div className="flex-1">
                    <p className={`text-sm ${notification.isRead ? 'font-normal' : 'font-medium'}`} style={{ color: 'var(--glass-text)' }}>
                      {notification.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                      {notification.message}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                    {getTimeAgo(notification.timestamp)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" style={{ color: 'var(--glass-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>No notifications</p>
            </div>
          )}
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
          <Link href="/app/settings" className="glass-profile-menu-item" onClick={() => setShowUserProfile(false)}>
            <User className="h-4 w-4" />
            <span>View Profile</span>
          </Link>
          <Link href="/app/settings" className="glass-profile-menu-item" onClick={() => setShowUserProfile(false)}>
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          <button className="glass-profile-menu-item w-full text-left" onClick={() => { setShowNotifications(true); setShowUserProfile(false); }}>
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </button>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2 opacity-20"></div>
          <button 
            onClick={() => { 
              setShowUserProfile(false); 
              signOut({ callbackUrl: '/auth/signin' }); 
            }}
            className="glass-profile-menu-item text-red-500 w-full text-left"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <ComposeEmailModal
        trigger={null}
        open={showComposeModal}
        onOpenChange={setShowComposeModal}
      />
      
      <CreateLeadModal
        open={showCreateLeadModal}
        onOpenChange={setShowCreateLeadModal}
      />
      
      <CreateEventModal
        open={showScheduleMeetingModal}
        onOpenChange={setShowScheduleMeetingModal}
      />
      
      <CreateTaskModal
        open={showCreateTaskModal}
        onOpenChange={setShowCreateTaskModal}
      />

      {/* Test simple modal instead of Radix Dialog */}
      {showCreateContactModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 0, 0, 0.98)',
            border: '3px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h2 style={{ color: 'white', marginBottom: '16px' }}>Create Contact Modal Test</h2>
            <p style={{ color: 'white', marginBottom: '16px' }}>This is a test modal to verify rendering works.</p>
            <button 
              onClick={() => setShowCreateContactModal(false)}
              style={{
                background: 'white',
                color: 'black',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Dialog open={showCreateContactModal} onOpenChange={setShowCreateContactModal}>
        <DialogContent 
          className="max-w-md glass-modal rounded-xl overflow-hidden"
          data-glass-theme="black"
          style={{ 
            background: 'rgba(255, 0, 0, 0.98)',
            border: '3px solid rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(32px) saturate(1.4) brightness(0.85)',
            display: 'none'
          }}
        >
          <DialogHeader className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <User className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold" style={{ color: 'var(--glass-text)' }}>
                  Add New Contact
                </DialogTitle>
                <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  Create a new contact in your CRM
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Contact Information Card */}
            <div className="glass-card p-4 rounded-lg transition-all duration-200 hover:bg-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-medium" style={{ color: 'var(--glass-text)' }}>
                    Contact Information
                  </h5>
                  <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                    Basic contact details
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contact-name" style={{ color: 'var(--glass-text)' }}>Full Name *</Label>
                  <Input 
                    id="contact-name" 
                    placeholder="Enter contact name" 
                    value={contactFormData.name}
                    onChange={(e) => setContactFormData({...contactFormData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact-email" style={{ color: 'var(--glass-text)' }}>Email *</Label>
                  <Input 
                    id="contact-email" 
                    type="email" 
                    placeholder="Enter email address" 
                    value={contactFormData.email}
                    onChange={(e) => setContactFormData({...contactFormData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-phone" style={{ color: 'var(--glass-text)' }}>Phone</Label>
                    <Input 
                      id="contact-phone" 
                      placeholder="Enter phone number" 
                      value={contactFormData.phone}
                      onChange={(e) => setContactFormData({...contactFormData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-company" style={{ color: 'var(--glass-text)' }}>Company</Label>
                    <Input 
                      id="contact-company" 
                      placeholder="Company name" 
                      value={contactFormData.company}
                      onChange={(e) => setContactFormData({...contactFormData, company: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-title" style={{ color: 'var(--glass-text)' }}>Job Title</Label>
                    <Input 
                      id="contact-title" 
                      placeholder="Job title" 
                      value={contactFormData.title}
                      onChange={(e) => setContactFormData({...contactFormData, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-location" style={{ color: 'var(--glass-text)' }}>Location</Label>
                    <Input 
                      id="contact-location" 
                      placeholder="City, State" 
                      value={contactFormData.location}
                      onChange={(e) => setContactFormData({...contactFormData, location: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Details Card */}
            <div className="glass-card p-4 rounded-lg transition-all duration-200 hover:bg-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-medium" style={{ color: 'var(--glass-text)' }}>
                    Additional Details
                  </h5>
                  <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                    Notes and extra information
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="contact-notes" style={{ color: 'var(--glass-text)' }}>Notes</Label>
                <Textarea 
                  id="contact-notes" 
                  placeholder="Additional notes..." 
                  value={contactFormData.notes}
                  onChange={(e) => setContactFormData({...contactFormData, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateContactModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                variant="liquid" 
                className="flex-1"
                onClick={async () => {
                  if (!contactFormData.name || !contactFormData.email) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  
                  setModalLoading(true);
                  try {
                    const response = await fetch('/api/contacts', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(contactFormData)
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                      setShowCreateContactModal(false);
                      setContactFormData({ name: '', email: '', phone: '', company: '', title: '', location: '', tags: [], notes: '' });
                      console.log('Contact created successfully!', result);
                    } else {
                      alert(result.error || 'Failed to create contact');
                    }
                  } catch (error) {
                    console.error('Failed to create contact:', error);
                    alert('Failed to create contact. Please try again.');
                  } finally {
                    setModalLoading(false);
                  }
                }}
                disabled={modalLoading}
              >
                {modalLoading ? 'Saving...' : 'Save Contact'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateListingModal} onOpenChange={setShowCreateListingModal}>
        <DialogContent 
          className="max-w-2xl glass-modal rounded-xl overflow-hidden"
          data-glass-theme="black"
          style={{ 
            background: 'rgba(255, 0, 0, 0.98)',
            border: '3px solid rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(32px) saturate(1.4) brightness(0.85)'
          }}
        >
          <DialogHeader className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold" style={{ color: 'var(--glass-text)' }}>
                  Create New Listing
                </DialogTitle>
                <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  Add a new property to your listings
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Basic Property Info Card */}
            <div className="glass-card p-4 rounded-lg transition-all duration-200 hover:bg-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-medium" style={{ color: 'var(--glass-text)' }}>
                    Property Information
                  </h5>
                  <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                    Basic property details and pricing
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="listing-address" style={{ color: 'var(--glass-text)' }}>Property Address *</Label>
                    <Input 
                      id="listing-address" 
                      placeholder="Enter property address" 
                      value={listingFormData.address}
                      onChange={(e) => setListingFormData({...listingFormData, address: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="listing-price" style={{ color: 'var(--glass-text)' }}>Price *</Label>
                    <Input 
                      id="listing-price" 
                      placeholder="$0" 
                      value={listingFormData.price}
                      onChange={(e) => setListingFormData({...listingFormData, price: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Property Specs Card */}
            <div className="glass-card p-4 rounded-lg transition-all duration-200 hover:bg-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  <Home className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-medium" style={{ color: 'var(--glass-text)' }}>
                    Property Specifications
                  </h5>
                  <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                    Bedrooms, bathrooms, and size details
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="listing-beds" style={{ color: 'var(--glass-text)' }}>Bedrooms</Label>
                  <Input 
                    id="listing-beds" 
                    type="number" 
                    placeholder="0" 
                    value={listingFormData.beds}
                    onChange={(e) => setListingFormData({...listingFormData, beds: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="listing-baths" style={{ color: 'var(--glass-text)' }}>Bathrooms</Label>
                  <Input 
                    id="listing-baths" 
                    type="number" 
                    placeholder="0" 
                    value={listingFormData.baths}
                    onChange={(e) => setListingFormData({...listingFormData, baths: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="listing-sqft" style={{ color: 'var(--glass-text)' }}>Square Feet</Label>
                  <Input 
                    id="listing-sqft" 
                    type="number" 
                    placeholder="0" 
                    value={listingFormData.sqft}
                    onChange={(e) => setListingFormData({...listingFormData, sqft: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="glass-card p-4 rounded-lg transition-all duration-200 hover:bg-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-medium" style={{ color: 'var(--glass-text)' }}>
                    Property Description
                  </h5>
                  <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                    Detailed description and features
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="listing-description" style={{ color: 'var(--glass-text)' }}>Description</Label>
                <Textarea 
                  id="listing-description" 
                  placeholder="Property description..." 
                  value={listingFormData.description}
                  onChange={(e) => setListingFormData({...listingFormData, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateListingModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                variant="liquid" 
                className="flex-1"
                onClick={async () => {
                  if (!listingFormData.address || !listingFormData.price) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  
                  setModalLoading(true);
                  try {
                    const response = await fetch('/api/listings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(listingFormData)
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                      setShowCreateListingModal(false);
                      setListingFormData({ address: '', price: '', beds: '', baths: '', sqft: '', description: '' });
                      console.log('Listing created successfully!', result);
                    } else {
                      alert(result.error || 'Failed to create listing');
                    }
                  } catch (error) {
                    console.error('Failed to create listing:', error);
                    alert('Failed to create listing. Please try again.');
                  } finally {
                    setModalLoading(false);
                  }
                }}
                disabled={modalLoading}
              >
                {modalLoading ? 'Creating...' : 'Create Listing'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* AI Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      <Toaster />
      
      {/* Custom Glass Cursor */}
    </div>
  );
}