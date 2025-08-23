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
import MobileShell from "./MobileShell";
import ChatAgent from "./ChatAgent";
import ComposeEmailModal from "@/components/inbox/ComposeEmailModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { signOut, useSession } from "next-auth/react";

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
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [contactFormData, setContactFormData] = useState({ name: '', email: '', phone: '', notes: '' });
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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          // Count unread notifications
          const unread = data.filter((notif: any) => !notif.isRead).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        // Search across multiple endpoints
        const [contactsRes, dealsRes] = await Promise.all([
          fetch(`/api/contacts?search=${encodeURIComponent(searchQuery)}`),
          fetch(`/api/pipeline/stages?search=${encodeURIComponent(searchQuery)}`)
        ]);

        const results = [];
        
        if (contactsRes.ok) {
          const contactsData = await contactsRes.json();
          const contacts = contactsData.contacts || contactsData || [];
          contacts.slice(0, 3).forEach((contact: any) => {
            results.push({
              id: `contact-${contact.id}`,
              type: 'contact',
              title: contact.name || contact.firstName + ' ' + contact.lastName,
              subtitle: `Contact • ${contact.email || 'No email'}`,
              icon: 'User',
              href: `/app/contacts/${contact.id}`
            });
          });
        }

        if (dealsRes.ok) {
          const dealsData = await dealsRes.json();
          const stages = dealsData.stages || [];
          const deals = stages.flatMap((stage: any) => stage.deals || []);
          deals.slice(0, 3).forEach((deal: any) => {
            results.push({
              id: `deal-${deal.id}`,
              type: 'deal',
              title: deal.title || deal.dealTitle,
              subtitle: `Deal • $${deal.dealValue?.toLocaleString() || '0'}`,
              icon: 'TrendingUp',
              href: `/app/pipeline?deal=${deal.id}`
            });
          });
        }

        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);
  const pathname = usePathname();

  
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
                      className="absolute left-7 top-1/2 -translate-y-1/2 h-5 w-5 z-10"
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
                      className="w-full pl-20 pr-24 text-base bg-transparent border-none outline-none font-medium py-5"
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
          <div className="glass-quick-action-item" onClick={() => { setShowCreateContactModal(true); setShowQuickActions(false); }}>
            <div className="glass-quick-action-icon">
              <User className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>Add Contact</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Create new contact</div>
            </div>
          </div>
          <div className="glass-quick-action-item" onClick={() => { setShowCreateListingModal(true); setShowQuickActions(false); }}>
            <div className="glass-quick-action-icon">
              <Building2 className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>New Listing</div>
              <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>Add property listing</div>
            </div>
          </div>
          <div className="glass-quick-action-item" onClick={() => { setShowScheduleMeetingModal(true); setShowQuickActions(false); }}>
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
          {searchLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="glass-spinner w-5 h-5"></div>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((result: any) => {
              const IconComponent = result.icon === 'User' ? User : 
                                 result.icon === 'TrendingUp' ? TrendingUp :
                                 result.icon === 'Building2' ? Building2 : MessageSquare;
              
              return (
                <Link 
                  key={result.id} 
                  href={result.href}
                  className="flex items-center gap-3 p-3 rounded-lg glass-hover-pulse"
                  onClick={() => setShowSearchResults(false)}
                >
                  <IconComponent className="h-4 w-4" style={{ color: 'var(--glass-text-muted)' }} />
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>{result.title}</div>
                    <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>{result.subtitle}</div>
                  </div>
                </Link>
              );
            })
          ) : searchQuery.length > 0 ? (
            <div className="text-center py-8">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" style={{ color: 'var(--glass-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>No results found</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" style={{ color: 'var(--glass-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>Start typing to search...</p>
            </div>
          )}
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
              
              return (
                <div key={notification.id} className="flex items-center gap-3 p-2 rounded-lg glass-hover-pulse">
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

      <Dialog open={showCreateContactModal} onOpenChange={setShowCreateContactModal}>
        <DialogContent className="max-w-md glass-modal">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contact-name">Full Name</Label>
              <Input 
                id="contact-name" 
                placeholder="Enter contact name" 
                value={contactFormData.name}
                onChange={(e) => setContactFormData({...contactFormData, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input 
                id="contact-email" 
                type="email" 
                placeholder="Enter email address" 
                value={contactFormData.email}
                onChange={(e) => setContactFormData({...contactFormData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Phone</Label>
              <Input 
                id="contact-phone" 
                placeholder="Enter phone number" 
                value={contactFormData.phone}
                onChange={(e) => setContactFormData({...contactFormData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="contact-notes">Notes</Label>
              <Textarea 
                id="contact-notes" 
                placeholder="Additional notes..." 
                value={contactFormData.notes}
                onChange={(e) => setContactFormData({...contactFormData, notes: e.target.value})}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateContactModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                variant="liquid" 
                className="flex-1"
                onClick={async () => {
                  setModalLoading(true);
                  try {
                    const response = await fetch('/api/contacts', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(contactFormData)
                    });
                    if (response.ok) {
                      setShowCreateContactModal(false);
                      setContactFormData({ name: '', email: '', phone: '', notes: '' });
                      // TODO: Show success toast
                    }
                  } catch (error) {
                    console.error('Failed to create contact:', error);
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
        <DialogContent className="max-w-2xl glass-modal">
          <DialogHeader>
            <DialogTitle>Create New Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="listing-address">Property Address</Label>
                <Input 
                  id="listing-address" 
                  placeholder="Enter property address" 
                  value={listingFormData.address}
                  onChange={(e) => setListingFormData({...listingFormData, address: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="listing-price">Price</Label>
                <Input 
                  id="listing-price" 
                  placeholder="$0" 
                  value={listingFormData.price}
                  onChange={(e) => setListingFormData({...listingFormData, price: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="listing-beds">Bedrooms</Label>
                <Input 
                  id="listing-beds" 
                  type="number" 
                  placeholder="0" 
                  value={listingFormData.beds}
                  onChange={(e) => setListingFormData({...listingFormData, beds: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="listing-baths">Bathrooms</Label>
                <Input 
                  id="listing-baths" 
                  type="number" 
                  placeholder="0" 
                  value={listingFormData.baths}
                  onChange={(e) => setListingFormData({...listingFormData, baths: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="listing-sqft">Square Feet</Label>
                <Input 
                  id="listing-sqft" 
                  type="number" 
                  placeholder="0" 
                  value={listingFormData.sqft}
                  onChange={(e) => setListingFormData({...listingFormData, sqft: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="listing-description">Description</Label>
              <Textarea 
                id="listing-description" 
                placeholder="Property description..." 
                value={listingFormData.description}
                onChange={(e) => setListingFormData({...listingFormData, description: e.target.value})}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateListingModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                variant="liquid" 
                className="flex-1"
                onClick={async () => {
                  setModalLoading(true);
                  try {
                    const response = await fetch('/api/listings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(listingFormData)
                    });
                    if (response.ok) {
                      setShowCreateListingModal(false);
                      setListingFormData({ address: '', price: '', beds: '', baths: '', sqft: '', description: '' });
                      // TODO: Show success toast
                    }
                  } catch (error) {
                    console.error('Failed to create listing:', error);
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

      <Dialog open={showScheduleMeetingModal} onOpenChange={setShowScheduleMeetingModal}>
        <DialogContent className="max-w-md glass-modal">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="meeting-title">Meeting Title</Label>
              <Input 
                id="meeting-title" 
                placeholder="Enter meeting title" 
                value={meetingFormData.title}
                onChange={(e) => setMeetingFormData({...meetingFormData, title: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meeting-date">Date</Label>
                <Input 
                  id="meeting-date" 
                  type="date" 
                  value={meetingFormData.date}
                  onChange={(e) => setMeetingFormData({...meetingFormData, date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="meeting-time">Time</Label>
                <Input 
                  id="meeting-time" 
                  type="time" 
                  value={meetingFormData.time}
                  onChange={(e) => setMeetingFormData({...meetingFormData, time: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="meeting-attendees">Attendees</Label>
              <Input 
                id="meeting-attendees" 
                placeholder="Enter email addresses" 
                value={meetingFormData.attendees}
                onChange={(e) => setMeetingFormData({...meetingFormData, attendees: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="meeting-notes">Notes</Label>
              <Textarea 
                id="meeting-notes" 
                placeholder="Meeting agenda or notes..." 
                value={meetingFormData.notes}
                onChange={(e) => setMeetingFormData({...meetingFormData, notes: e.target.value})}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowScheduleMeetingModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                variant="liquid" 
                className="flex-1"
                onClick={async () => {
                  setModalLoading(true);
                  try {
                    const response = await fetch('/api/meetings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(meetingFormData)
                    });
                    if (response.ok) {
                      setShowScheduleMeetingModal(false);
                      setMeetingFormData({ title: '', date: '', time: '', attendees: '', notes: '' });
                      // TODO: Show success toast
                    }
                  } catch (error) {
                    console.error('Failed to schedule meeting:', error);
                  } finally {
                    setModalLoading(false);
                  }
                }}
                disabled={modalLoading}
              >
                {modalLoading ? 'Scheduling...' : 'Schedule Meeting'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}