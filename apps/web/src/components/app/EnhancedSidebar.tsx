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
          <div className={`flex items-center ${isCollapsed ? 'flex-1 justify-center' : 'flex-1 justify-center'}`}>
            <Link href="/app" className="flex items-center group">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCollapsed ? (
                  // Collapsed - Enhanced liquid glass condensed logo
                  <div className="relative w-9 h-9 overflow-visible">
                    {/* Glass backdrop blur layer */}
                    <div 
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: theme === 'black' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.05)',
                        backdropFilter: 'blur(20px) saturate(1.8)',
                        WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
                        boxShadow: `
                          inset 0 1px 0 rgba(255, 255, 255, 0.1),
                          inset 0 -1px 0 rgba(0, 0, 0, 0.1),
                          0 4px 12px rgba(6, 182, 212, 0.15),
                          0 8px 25px rgba(6, 182, 212, 0.1)
                        `,
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    />
                    {/* Floating shimmer effect */}
                    <div 
                      className="absolute inset-0 rounded-xl opacity-40"
                      style={{
                        background: 'linear-gradient(135deg, transparent 30%, rgba(6, 182, 212, 0.1) 50%, transparent 70%)',
                        animation: 'shimmer 3s ease-in-out infinite'
                      }}
                    />
                    <motion.img
                      key={`logo-condensed-${theme}`}
                      src={theme === 'black' 
                        ? '/images/Dark%20mode%20Sidebar.svg' 
                        : '/images/Light%20Mode%20Sidebar.svg'
                      }
                      alt="Logo"
                      className="relative w-full h-full object-contain z-10"
                      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                      transition={{ 
                        duration: 0.8,
                        ease: [0.4, 0, 0.2, 1],
                        opacity: { duration: 0.5 },
                        scale: { duration: 0.6, ease: "backOut" },
                        rotate: { duration: 0.8 }
                      }}
                      style={{
                        filter: `
                          drop-shadow(0 0 8px rgba(6, 182, 212, 0.4))
                          drop-shadow(0 0 16px rgba(6, 182, 212, 0.2))
                          brightness(1.1)
                          saturate(1.2)
                        `,
                        mixBlendMode: 'screen'
                      }}
                      whileHover={{
                        scale: 1.05,
                        filter: `
                          drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))
                          drop-shadow(0 0 24px rgba(6, 182, 212, 0.3))
                          brightness(1.2)
                          saturate(1.3)
                        `
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                ) : (
                  // Expanded - Enhanced liquid glass wordmark logo
                  <div className="relative h-12 overflow-visible flex items-center justify-center w-full">
                    {/* Glass backdrop container */}
                    <div 
                      className="absolute -inset-2 rounded-2xl"
                      style={{
                        background: theme === 'black' 
                          ? 'rgba(255, 255, 255, 0.03)' 
                          : 'rgba(0, 0, 0, 0.03)',
                        backdropFilter: 'blur(25px) saturate(1.8) brightness(1.1)',
                        WebkitBackdropFilter: 'blur(25px) saturate(1.8) brightness(1.1)',
                        boxShadow: `
                          inset 0 1px 0 rgba(255, 255, 255, 0.08),
                          inset 0 -1px 0 rgba(0, 0, 0, 0.05),
                          0 6px 20px rgba(6, 182, 212, 0.1),
                          0 12px 35px rgba(6, 182, 212, 0.08)
                        `,
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    />
                    {/* Liquid morphing border animation */}
                    <div 
                      className="absolute -inset-2 rounded-2xl opacity-60"
                      style={{
                        background: 'linear-gradient(45deg, rgba(6, 182, 212, 0.1) 0%, transparent 25%, rgba(147, 51, 234, 0.1) 50%, transparent 75%, rgba(6, 182, 212, 0.1) 100%)',
                        animation: 'liquidMorph 8s ease-in-out infinite, gradientShift 6s ease-in-out infinite'
                      }}
                    />
                    {/* Floating particles effect */}
                    <div 
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: 'radial-gradient(circle at 20% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
                        animation: 'float 4s ease-in-out infinite'
                      }}
                    />
                    <motion.img
                      key={`logo-full-${theme}`}
                      src={theme === 'black' 
                        ? '/images/Full%20Sidebar%20Dark%20Mode.svg' 
                        : '/images/Full%20Sidebar%20Light%20Mode.svg'
                      }
                      alt="Rivor"
                      className="relative h-full w-auto object-contain z-10"
                      initial={{ opacity: 0, x: -20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.9 }}
                      transition={{ 
                        duration: 0.8,
                        ease: [0.4, 0, 0.2, 1],
                        opacity: { duration: 0.5 },
                        x: { duration: 0.6 },
                        scale: { duration: 0.6, ease: "backOut" }
                      }}
                      style={{
                        filter: `
                          drop-shadow(0 0 12px rgba(6, 182, 212, 0.4))
                          drop-shadow(0 0 20px rgba(6, 182, 212, 0.2))
                          brightness(1.1)
                          saturate(1.2)
                        `,
                        maxWidth: '220px',
                        mixBlendMode: 'screen'
                      }}
                      whileHover={{
                        scale: 1.02,
                        filter: `
                          drop-shadow(0 0 16px rgba(6, 182, 212, 0.6))
                          drop-shadow(0 0 30px rgba(6, 182, 212, 0.3))
                          brightness(1.2)
                          saturate(1.3)
                        `
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </motion.div>
            </Link>
          </div>
          
        </div>

        {/* Navigation Content */}
        <div className="flex-1 flex flex-col relative z-10">
          {/* Core Navigation */}
          <div className={`py-3 flex-1 ${isCollapsed ? 'px-1' : 'px-3'}`}>
            <nav className="space-y-1">
              {groupedItems.core.map((item, index) => {
                const active = isActive(item);
                return (
                  <Tooltip key={item.href} delayDuration={isCollapsed ? 0 : 1000}>
                    <TooltipTrigger asChild>
                      <Link href={item.href} className="block">
                        <div
                          className={`glass-nav-item ${active ? 'active' : ''} group relative transition-all duration-100 ${
                            isCollapsed 
                              ? 'flex items-center justify-center' 
                              : 'flex flex-col items-center text-center'
                          }`}
                          style={{
                            background: active ? 'var(--glass-surface)' : 'rgba(0, 0, 0, 0)',
                            border: `1px solid ${active ? 'var(--glass-border)' : 'rgba(0, 0, 0, 0)'}`,
                            color: active ? 'var(--glass-text)' : 'var(--glass-text-muted)',
                            borderRadius: '12px',
                            padding: isCollapsed ? '10px' : '12px 10px',
                            margin: isCollapsed ? '2px 4px' : '2px 8px',
                            minHeight: isCollapsed ? 'auto' : '56px'
                          }}
                        >
                          <div className={`${isCollapsed ? '' : 'mb-2'} flex-shrink-0 relative`}>
                            {item.icon}
                            {item.badge && item.badge.count > 0 && isCollapsed && (
                              <div
                                className="absolute -top-2 -right-2 glass-bubble text-xs font-bold"
                                style={{
                                  background: item.badge.color === 'destructive' 
                                    ? 'rgba(255, 59, 48, 0.9)' 
                                    : item.badge.color === 'warning'
                                    ? 'rgba(255, 193, 7, 0.9)'
                                    : 'rgba(52, 199, 89, 0.9)',
                                  color: '#ffffff',
                                  borderRadius: '50%',
                                  minWidth: '18px',
                                  height: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px'
                                }}
                              >
                                {item.badge.count}
                              </div>
                            )}
                          </div>
                          
                          {!isCollapsed && (
                            <div className="flex flex-col items-center min-w-0">
                              <span className="font-medium text-sm truncate text-center">
                                {item.label}
                              </span>
                              {item.badge && item.badge.count > 0 && (
                                <div
                                  className="mt-1 glass-bubble px-2 py-1 text-xs font-bold"
                                  style={{
                                    background: item.badge.color === 'destructive' 
                                      ? 'rgba(255, 59, 48, 0.2)' 
                                      : item.badge.color === 'warning'
                                      ? 'rgba(255, 193, 7, 0.2)'
                                      : 'rgba(52, 199, 89, 0.2)',
                                    color: 'var(--glass-text)',
                                    borderRadius: '12px',
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

          {/* Silent Divider */}
          <div className={`${isCollapsed ? 'px-2' : 'px-6'} py-2`}>
            <div className="h-px" style={{ background: 'var(--glass-border)', opacity: 0.3 }}></div>
          </div>

          {/* Utilities Section */}
          <div className={`py-1 ${isCollapsed ? 'px-1' : 'px-3'}`}>
            {groupedItems.utilities.map((item) => {
              const active = isActive(item);
              return (
                <Tooltip key={item.href} delayDuration={isCollapsed ? 0 : 1000}>
                  <TooltipTrigger asChild>
                    <Link href={item.href} className="block">
                      <div
                        className={`glass-nav-item ${active ? 'active' : ''} group relative transition-all duration-100 ${
                          isCollapsed 
                            ? 'flex items-center justify-center' 
                            : 'flex flex-col items-center text-center'
                        }`}
                        style={{
                          background: active ? 'var(--glass-surface)' : 'rgba(0, 0, 0, 0)',
                          border: `1px solid ${active ? 'var(--glass-border)' : 'rgba(0, 0, 0, 0)'}`,
                          color: active ? 'var(--glass-text)' : 'var(--glass-text-muted)',
                          borderRadius: '12px',
                          padding: isCollapsed ? '10px' : '12px 10px',
                          margin: isCollapsed ? '2px 4px' : '2px 8px',
                          minHeight: isCollapsed ? 'auto' : '56px'
                        }}
                      >
                        <div className={`${isCollapsed ? '' : 'mb-2'} flex-shrink-0`}>
                          {item.icon}
                        </div>
                        {!isCollapsed && (
                          <span className="font-medium text-sm truncate text-center">
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