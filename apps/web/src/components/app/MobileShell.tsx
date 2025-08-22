"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, PanInfo, useSpring, useTransform } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useMobileGestures, useMobileKeyboard, useMobileScroll } from "@/hooks/useMobileGestures";
import {
  Home,
  Inbox,
  GitBranch,
  Users,
  Calendar,
  CheckSquare,
  Bot,
  FolderOpen,
  BarChart3,
  Search,
  Bell,
  Plus,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MessageSquare,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface MobileShellProps {
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: Home },
  { href: "/app/inbox", label: "Inbox", icon: Inbox, badge: 3 },
  { href: "/app/pipeline", label: "Pipeline", icon: GitBranch, badge: 2 },
  { href: "/app/contacts", label: "Contacts", icon: Users },
  { href: "/app/calendar", label: "Calendar", icon: Calendar },
  { href: "/app/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/app/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/app/documents", label: "Documents", icon: FolderOpen },
  { href: "/app/reporting", label: "Reporting", icon: BarChart3 },
];

export default function MobileShell({ children }: MobileShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme } = useTheme();
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  
  // Mobile optimizations
  useMobileKeyboard();
  useMobileScroll();

  // Get current tab index
  useEffect(() => {
    const mainTabs = navItems.slice(0, 4);
    const currentIndex = mainTabs.findIndex(item => {
      if (item.href === "/app") return pathname === "/app";
      return pathname.startsWith(item.href);
    });
    if (currentIndex !== -1) {
      setActiveTabIndex(currentIndex);
    }
  }, [pathname]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          const unread = data.filter((notif: any) => !notif.isRead).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  // Prevent body scroll when overlays are open
  useEffect(() => {
    if (showSidebar || showSearch || showNotifications || showProfile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSidebar, showSearch, showNotifications, showProfile]);

  // Enhanced swipe gestures for sidebar
  useMobileGestures(mainContentRef, {
    onSwipeRight: () => {
      if (!showSidebar) {
        setShowSidebar(true);
      }
    },
    onSwipeLeft: () => {
      if (showSidebar) {
        setShowSidebar(false);
      }
    },
    threshold: 50,
    velocity: 0.3
  });

  const getUserInitials = () => {
    if (!session?.user?.name && !session?.user?.email) return 'U';
    const name = session?.user?.name || session?.user?.email?.split('@')[0];
    return name?.split(' ')?.map(word => word.charAt(0))?.join('')?.toUpperCase()?.slice(0, 2) || 'U';
  };

  const isActive = (href: string) => {
    if (href === "/app") return pathname === href;
    return pathname.startsWith(href);
  };

  const getPageTitle = () => {
    const item = navItems.find(item => isActive(item.href));
    return item?.label || "Rivor";
  };

  const handleTabSwipe = (direction: 'left' | 'right') => {
    const mainTabs = navItems.slice(0, 4);
    let newIndex = activeTabIndex;
    
    if (direction === 'left' && activeTabIndex > 0) {
      newIndex = activeTabIndex - 1;
    } else if (direction === 'right' && activeTabIndex < mainTabs.length - 1) {
      newIndex = activeTabIndex + 1;
    }
    
    if (newIndex !== activeTabIndex) {
      setActiveTabIndex(newIndex);
      router.push(mainTabs[newIndex].href);
    }
  };

  return (
    <div className={`${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'} min-h-screen relative overflow-hidden`}>

      {/* Modern Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center px-4"
        style={{
          background: 'var(--glass-surface)',
          backdropFilter: 'blur(32px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
          borderBottom: '1px solid var(--glass-border)',
          boxShadow: 'inset 0 1px 0 var(--glass-highlight)'
        }}
      >
        <div className="flex items-center justify-between w-full">
          {/* Left: Menu + Title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(true)}
              className="h-10 w-10 glass-button"
            >
              <Menu className="h-5 w-5" style={{ color: 'var(--glass-text)' }} />
            </Button>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--glass-text)' }}>
              {getPageTitle()}
            </h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(true)}
              className="h-10 w-10 glass-button"
            >
              <Search className="h-5 w-5" style={{ color: 'var(--glass-text)' }} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(true)}
              className="h-10 w-10 glass-button relative"
            >
              <Bell className="h-5 w-5" style={{ color: 'var(--glass-text)' }} />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowProfile(true)}
              className="h-10 w-10 glass-button"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="text-xs font-medium">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Enhanced Swipe Navigation */}
      <main 
        ref={mainContentRef}
        className="pt-16 pb-20 min-h-screen overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Modern Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-30 px-2 py-2"
        style={{
          background: 'var(--glass-surface)',
          backdropFilter: 'blur(32px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
          borderTop: '1px solid var(--glass-border)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
        }}
      >
        <div className="flex items-center justify-around">
          {navItems.slice(0, 4).map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 relative min-w-0"
                style={{
                  color: active ? 'var(--glass-primary)' : 'var(--glass-text-muted)',
                  backgroundColor: active ? 'var(--glass-primary-muted)' : 'transparent'
                }}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 text-xs p-0 flex items-center justify-center bg-red-500 text-white">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium truncate max-w-[60px]">
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    className="absolute -bottom-1 w-1 h-1 rounded-full"
                    style={{ backgroundColor: 'var(--glass-primary)' }}
                    layoutId="activeTab"
                  />
                )}
              </Link>
            );
          })}
          
          <Button
            variant="ghost"
            onClick={() => setShowSidebar(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl"
            style={{ color: 'var(--glass-text-muted)' }}
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs font-medium">More</span>
          </Button>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setShowSidebar(false)}
            />
            <motion.div
              ref={sidebarRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] flex flex-col shadow-2xl"
              style={{
                background: 'var(--glass-surface)',
                backdropFilter: 'blur(32px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
                borderRight: '1px solid var(--glass-border)',
              }}
              onPanStart={handlePanStart}
              onPanEnd={handlePanEnd}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ 
                      background: theme === 'black' 
                        ? 'linear-gradient(135deg, #ffffff, rgba(255,255,255,0.8))'
                        : 'linear-gradient(135deg, #000000, rgba(0,0,0,0.8))',
                      color: theme === 'black' ? '#000000' : '#ffffff'
                    }}
                  >
                    <span className="font-bold text-sm">R</span>
                  </div>
                  <span className="font-semibold text-lg" style={{ color: 'var(--glass-text)' }}>
                    Rivor
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(false)}
                  className="glass-button"
                >
                  <X className="h-5 w-5" style={{ color: 'var(--glass-text)' }} />
                </Button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--glass-text-muted)' }}>
                    Navigation
                  </h3>
                  <div className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowSidebar(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200"
                          style={{
                            backgroundColor: active ? 'var(--glass-primary-muted)' : 'transparent',
                            color: active ? 'var(--glass-primary)' : 'var(--glass-text-secondary)',
                          }}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge className="ml-auto h-5 w-5 text-xs p-0 flex items-center justify-center bg-red-500 text-white">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--glass-text-muted)' }}>
                    Account
                  </h3>
                  <div className="space-y-1">
                    <Link
                      href="/app/settings"
                      onClick={() => setShowSidebar(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200"
                      style={{ color: 'var(--glass-text-secondary)' }}
                    >
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowSidebar(false);
                        signOut({ callbackUrl: '/auth/signin' });
                      }}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 w-full text-left text-red-500"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              </nav>

              {/* User Profile Footer */}
              <div className="p-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                <div 
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    backgroundColor: 'var(--glass-surface-subtle)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--glass-text)' }}>
                      {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--glass-text-muted)' }}>
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-50 p-4 pt-6"
            style={{
              background: 'var(--glass-surface)',
              backdropFilter: 'blur(32px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
              borderBottom: '1px solid var(--glass-border)',
              paddingTop: 'max(env(safe-area-inset-top), 1.5rem)',
            }}
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(false)}
                className="glass-button"
              >
                <ChevronLeft className="h-5 w-5" style={{ color: 'var(--glass-text)' }} />
              </Button>
              <Input
                placeholder="Search everything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                autoFocus
                style={{
                  background: 'var(--glass-surface-subtle)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--glass-text)'
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Overlay */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw]"
            style={{
              background: 'var(--glass-surface)',
              backdropFilter: 'blur(32px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
              borderLeft: '1px solid var(--glass-border)',
            }}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--glass-text)' }}>
                Notifications
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(false)}
                className="glass-button"
              >
                <X className="h-5 w-5" style={{ color: 'var(--glass-text)' }} />
              </Button>
            </div>
            <div className="p-4">
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.slice(0, 10).map((notification: any) => (
                    <div key={notification.id} className="p-3 rounded-xl" style={{ backgroundColor: 'var(--glass-surface-subtle)' }}>
                      <p className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>
                        {notification.title}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--glass-text-muted)' }}>
                        {notification.message}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" style={{ color: 'var(--glass-text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>No notifications</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Overlay */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 z-50 rounded-2xl p-6"
            style={{
              background: 'var(--glass-surface)',
              backdropFilter: 'blur(32px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
              border: '1px solid var(--glass-border)',
              top: '20%',
              bottom: '20%'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--glass-text)' }}>
                Profile
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowProfile(false)}
                className="glass-button"
              >
                <X className="h-5 w-5" style={{ color: 'var(--glass-text)' }} />
              </Button>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="text-lg font-medium">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-lg" style={{ color: 'var(--glass-text)' }}>
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
                  {session?.user?.email}
                </p>
              </div>
              
              <div className="w-full space-y-2 mt-6">
                <Link
                  href="/app/settings"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 p-3 rounded-xl w-full transition-all duration-200"
                  style={{ backgroundColor: 'var(--glass-surface-subtle)' }}
                >
                  <Settings className="h-5 w-5" style={{ color: 'var(--glass-text-secondary)' }} />
                  <span style={{ color: 'var(--glass-text)' }}>Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    signOut({ callbackUrl: '/auth/signin' });
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl w-full transition-all duration-200 text-red-500"
                  style={{ backgroundColor: 'var(--glass-surface-subtle)' }}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for overlays */}
      <AnimatePresence>
        {(showSearch || showNotifications || showProfile) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => {
              setShowSearch(false);
              setShowNotifications(false);
              setShowProfile(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}