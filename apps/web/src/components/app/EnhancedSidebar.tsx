"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/ThemeContext";
import GlassThemeToggle from "@/components/ui/GlassThemeToggle";
import {
  BarChart3,
  Inbox,
  GitBranch,
  Calendar,
  Building2,
  Users,
  MessageSquare,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  User,
  Bell,
  HelpCircle,
  ExternalLink,
  TrendingUp,
  Home,
  Star,
  AlertCircle,
  Clock,
  DollarSign,
  MapPin,
  FileText,
  Phone,
  Mail,
  Video,
  Bookmark,
  Archive,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Bot,
  FolderOpen
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: {
    count: number;
    color: 'destructive' | 'warning' | 'success' | 'default';
  };
  group?: 'core' | 'utilities';
  exactMatch?: boolean;
  description?: string;
  isExternal?: boolean;
}


interface EnhancedSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function EnhancedSidebar({ 
  isCollapsed, 
  onToggleCollapse 
}: EnhancedSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([
    { id: 'inbox', count: 0, color: 'destructive' as const },
    { id: 'pipeline', count: 0, color: 'warning' as const },
    { id: 'calendar', count: 0, color: 'success' as const }
  ]);

  // Fetch real notification counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch unread email count
        const dashboardResponse = await fetch('/api/dashboard');
        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          const inboxCount = dashboardData.unreadCount || 0;
          const calendarCount = dashboardData.calendarStats?.todayCount || 0;
          
          // Fetch pipeline stats
          const pipelineResponse = await fetch('/api/pipeline/stats');
          let pipelineCount = 0;
          if (pipelineResponse.ok) {
            const pipelineData = await pipelineResponse.json();
            // Count active leads as pipeline notifications
            pipelineCount = pipelineData.totalLeads || 0;
          }
          
          setNotifications([
            { id: 'inbox', count: inboxCount, color: 'destructive' as const },
            { id: 'pipeline', count: pipelineCount, color: 'warning' as const },
            { id: 'calendar', count: calendarCount, color: 'success' as const }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch notification counts:', error);
      }
    };

    fetchCounts();
    // Refresh counts every 60 seconds
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const navItems: NavItem[] = [
    // Core Features  
    { 
      href: "/app",
      label: "Dashboard",
      icon: <Home className="h-4 w-4" />,
      group: 'core',
      exactMatch: true,
      description: 'Overview and key metrics'
    },
    {
      href: "/app/inbox",
      label: "Inbox",
      icon: <Inbox className="h-4 w-4" />,
      badge: notifications.find(n => n.id === 'inbox'),
      group: 'core',
      description: 'Email management and responses'
    },
    {
      href: "/app/pipeline",
      label: "Pipeline",
      icon: <GitBranch className="h-4 w-4" />,
      badge: notifications.find(n => n.id === 'pipeline'),
      group: 'core',
      description: 'Sales pipeline and deals'
    },
    {
      href: "/app/contacts",
      label: "Contacts",
      icon: <Users className="h-4 w-4" />,
      group: 'core',
      description: 'Customer relationship management'
    },
    {
      href: "/app/calendar",
      label: "Calendar",
      icon: <Calendar className="h-4 w-4" />,
      badge: notifications.find(n => n.id === 'calendar'),
      group: 'core',
      description: 'Appointments and scheduling'
    },
    {
      href: "/app/tasks",
      label: "Tasks",
      icon: <CheckSquare className="h-4 w-4" />,
      group: 'core',
      description: 'Task management and reminders'
    },
    {
      href: "/app/ai-assistant",
      label: "AI Assistant",
      icon: <Bot className="h-4 w-4" />,
      group: 'core',
      description: 'AI-powered assistance and automation'
    },
    {
      href: "/app/documents",
      label: "Documents",
      icon: <FolderOpen className="h-4 w-4" />,
      group: 'core',
      description: 'Document management and storage'
    },
    {
      href: "/app/reporting",
      label: "Reporting",
      icon: <BarChart3 className="h-4 w-4" />,
      group: 'core',
      description: 'Analytics and business insights'
    },
    
    // Utilities
    { 
      href: "/app/settings", 
      label: "Settings", 
      icon: <Settings className="h-4 w-4" />, 
      group: 'utilities',
      description: 'App settings and preferences'
    }
  ];


  const groupedItems = {
    core: navItems.filter(item => item.group === 'core'),
    utilities: navItems.filter(item => item.group === 'utilities'),
  };

  const isActive = (item: NavItem) => {
    if (item.exactMatch) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    return session.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getNotificationCount = () => {
    return notifications.reduce((sum, notif) => sum + notif.count, 0);
  };

  return (
    <TooltipProvider>
      <aside 
        className={`glass-sidebar-unified sticky top-0 h-screen hidden md:flex md:flex-col transition-all duration-200 ease-out ${
          isCollapsed ? 'w-[72px]' : 'w-[280px]'
        } relative overflow-hidden`}
        style={{ 
          zIndex: 'var(--z-sidebar)',
          background: 'var(--glass-surface-subtle)',
          backdropFilter: 'blur(32px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
          borderRight: '1px solid var(--glass-border)',
          borderRadius: '0'
        }}
      >
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute w-32 h-32 top-[10%] left-[10%] rounded-full glass-surface-subtle blur-xl" />
          <div className="absolute w-24 h-24 top-[70%] right-[5%] rounded-full glass-surface-subtle blur-xl" />
        </div>

        {/* Enhanced Liquid Glass Header - Seamlessly Unified */}
        <div 
          className="relative z-10 h-16 flex items-center glass-sidebar-header-seamless"
          style={{
            borderBottom: '1px solid var(--glass-border)',
            borderRadius: '0',
            padding: isCollapsed ? '0 8px' : '0 16px',
            background: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none'
          }}
        >
          {/* Logo Section */}
          <div className={`flex items-center ${isCollapsed ? 'flex-1 justify-center' : 'flex-1'}`}>
            <Link href="/app" className="flex items-center group">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCollapsed ? (
                  // Collapsed - Show logo image with theme-based switching
                  <div className="relative w-8 h-8 overflow-hidden">
                    <motion.img
                      key={`logo-${theme}`}
                      src={theme === 'black' 
                        ? '/images/Dark Mode Sidebar' 
                        : '/images/Light Mode Sidebar'
                      }
                      alt="Logo"
                      className="w-full h-full object-contain"
                      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                      transition={{ 
                        duration: 0.6,
                        ease: [0.4, 0, 0.2, 1],
                        opacity: { duration: 0.4 },
                        scale: { duration: 0.5, ease: "backOut" },
                        rotate: { duration: 0.6 }
                      }}
                      style={{
                        filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.3))'
                      }}
                    />
                  </div>
                ) : (
                  // Expanded - Show logo with text
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 overflow-hidden">
                      <motion.img
                        key={`logo-expanded-${theme}`}
                        src={theme === 'black' 
                          ? '/images/Dark Mode Sidebar' 
                          : '/images/Light Mode Sidebar'
                        }
                        alt="Logo"
                        className="w-full h-full object-contain"
                        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                        transition={{ 
                          duration: 0.6,
                          ease: [0.4, 0, 0.2, 1],
                          opacity: { duration: 0.4 },
                          scale: { duration: 0.5, ease: "backOut" },
                          rotate: { duration: 0.6 }
                        }}
                        style={{
                          filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.3))'
                        }}
                      />
                    </div>
                    <motion.span 
                      className="font-bold leading-none tracking-tight glass-gradient-text cursor-pointer text-2xl"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      style={{
                        background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 25%, #9333ea 50%, #06b6d4 75%, #3b82f6 100%)',
                        backgroundSize: '400% 400%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        animation: 'gradientShift 8s ease-in-out infinite',
                        filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.3))'
                      }}
                    >
                      Rivor
                    </motion.span>
                  </div>
                )}
              </motion.div>
            </Link>
          </div>
          
        </div>

        {/* Navigation Content */}
        <div className="flex-1 flex flex-col relative z-10">
          {/* Core Navigation */}
          <div className={`py-4 flex-1 ${isCollapsed ? 'px-1' : 'px-3'}`}>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="mb-4"
                >
                  <h3 
                    className="text-xs font-semibold uppercase tracking-wider mb-2 px-2"
                    style={{ color: 'var(--glass-text-muted)' }}
                  >
                    Core Features
                  </h3>
                </motion.div>
              )}
            </AnimatePresence>

            <nav className="space-y-1">
              {groupedItems.core.map((item, index) => {
                const active = isActive(item);
                return (
                  <Tooltip key={item.href} delayDuration={isCollapsed ? 0 : 1000}>
                    <TooltipTrigger asChild>
                      <Link href={item.href} className="block">
                        <div
                          className={`glass-nav-item ${active ? 'active' : ''} group relative flex items-center gap-3 transition-all duration-100`}
                          style={{
                            background: active ? 'var(--glass-surface)' : 'rgba(0, 0, 0, 0)',
                            border: `1px solid ${active ? 'var(--glass-border)' : 'rgba(0, 0, 0, 0)'}`,
                            color: active ? 'var(--glass-text)' : 'var(--glass-text-muted)',
                            borderRadius: '12px',
                            padding: isCollapsed ? '12px' : '12px',
                            margin: isCollapsed ? '4px 4px' : '4px 8px',
                            justifyContent: isCollapsed ? 'center' : 'flex-start'
                          }}
                        >
                          <div className="flex-shrink-0">
                            {item.icon}
                          </div>
                          
                          {!isCollapsed && (
                            <div className="flex-1 flex items-center justify-between min-w-0">
                              <span className="font-medium truncate">
                                {item.label}
                              </span>
                              {item.badge && item.badge.count > 0 && (
                                <div
                                  className="glass-bubble px-2 py-1 text-xs font-bold"
                                  style={{
                                    background: item.badge.color === 'destructive' 
                                      ? 'rgba(255, 59, 48, 0.2)' 
                                      : item.badge.color === 'warning'
                                      ? 'rgba(255, 193, 7, 0.2)'
                                      : 'rgba(52, 199, 89, 0.2)',
                                    color: 'var(--glass-text)',
                                    borderRadius: '50%',
                                    minWidth: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {item.badge.count}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" className="glass-panel">
                        <p className="font-medium">{item.label}</p>
                        {item.description && (
                          <p className="text-xs opacity-70">{item.description}</p>
                        )}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>

          </div>

          {/* Utilities Section */}
          <div className={`py-2 ${isCollapsed ? 'px-1' : 'px-3'}`}>
            {groupedItems.utilities.map((item) => {
              const active = isActive(item);
              return (
                <Tooltip key={item.href} delayDuration={isCollapsed ? 0 : 1000}>
                  <TooltipTrigger asChild>
                    <Link href={item.href} className="block">
                      <div
                        className={`glass-nav-item ${active ? 'active' : ''} group relative flex items-center gap-3 transition-all duration-100`}
                        style={{
                          background: active ? 'var(--glass-surface)' : 'rgba(0, 0, 0, 0)',
                          border: `1px solid ${active ? 'var(--glass-border)' : 'rgba(0, 0, 0, 0)'}`,
                          color: active ? 'var(--glass-text)' : 'var(--glass-text-muted)',
                          borderRadius: '12px',
                          padding: isCollapsed ? '12px' : '12px',
                          margin: isCollapsed ? '4px 4px' : '4px 8px',
                          justifyContent: isCollapsed ? 'center' : 'flex-start'
                        }}
                      >
                        <div>
                          {item.icon}
                        </div>
                        {!isCollapsed && (
                          <span className="font-medium">
                            {item.label}
                          </span>
                        )}
                      </div>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" className="glass-panel">
                      <p className="font-medium">{item.label}</p>
                      {item.description && (
                        <p className="text-xs opacity-70">{item.description}</p>
                      )}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>

          {/* Glass Theme Toggle */}
          <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="flex items-center justify-center">
              <GlassThemeToggle />
            </div>
          </div>

          {/* Collapse Controls Section */}
          <div className={`py-3 border-t ${isCollapsed ? 'px-2' : 'px-4'}`} style={{ borderColor: 'var(--glass-border)' }}>
            <div className="flex items-center justify-center">
              <button
                onClick={onToggleCollapse}
                className="glass-collapse-unified p-2"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                style={{
                  background: 'var(--glass-surface-subtle)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  width: isCollapsed ? '28px' : '32px',
                  height: isCollapsed ? '28px' : '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: '0.8'
                }}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5" style={{ color: 'var(--glass-text)' }} />
                ) : (
                  <ChevronLeft className="h-3.5 w-3.5" style={{ color: 'var(--glass-text)' }} />
                )}
              </button>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            {!isCollapsed ? (
              <div className="glass-card p-3 flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback
                      className="text-xs font-medium"
                      style={{
                        background: theme === 'black' 
                          ? 'linear-gradient(135deg, #ffffff, rgba(255,255,255,0.8))'
                          : 'linear-gradient(135deg, #000000, rgba(0,0,0,0.8))',
                        color: theme === 'black' ? '#000000' : '#ffffff'
                      }}
                    >
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--glass-text)' }}>
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--glass-text-muted)' }}>
                      {session?.user?.email || 'user@example.com'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="glass-button p-1"
                    style={{
                      background: 'var(--glass-surface-subtle)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px'
                    }}
                  >
                    <LogOut className="h-3 w-3" style={{ color: 'var(--glass-text-muted)' }} />
                  </Button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback
                      className="text-xs font-medium"
                      style={{
                        background: theme === 'black' 
                          ? 'linear-gradient(135deg, #ffffff, rgba(255,255,255,0.8))'
                          : 'linear-gradient(135deg, #000000, rgba(0,0,0,0.8))',
                        color: theme === 'black' ? '#000000' : '#ffffff'
                      }}
                    >
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}