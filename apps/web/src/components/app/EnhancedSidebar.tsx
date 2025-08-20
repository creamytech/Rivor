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
  Palette,
  Home,
  Star,
  AlertCircle,
  Clock,
  DollarSign,
  MapPin,
  Key,
  FileText,
  Phone,
  Mail,
  Video,
  Bookmark,
  Archive,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exactMatch?: boolean;
  badge?: number;
  badgeColor?: 'default' | 'destructive' | 'warning' | 'success';
  group: 'core' | 'utilities';
  description?: string;
  widget?: {
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    subtitle?: string;
  };
}

interface EnhancedSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function EnhancedSidebar({ isCollapsed, onToggleCollapse }: EnhancedSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showQuickActionsMenu, setShowQuickActionsMenu] = useState(false);
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', type: 'urgent', count: 3, message: 'High priority leads' },
    { id: '2', type: 'info', count: 7, message: 'New property inquiries' },
    { id: '3', type: 'reminder', count: 2, message: 'Follow-ups due today' }
  ]);
  const { currentTheme } = useTheme();

  // Close quick actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showQuickActionsMenu && !(event.target as Element).closest('.quick-actions-menu')) {
        setShowQuickActionsMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showQuickActionsMenu]);

  // Simplified interaction - removed keyboard shortcuts for cleaner UX

  // Day-1 Core Navigation - Streamlined for launch
  const navItems: NavItem[] = [
    // Core Workflows
    { 
      href: "/app", 
      label: "Dashboard", 
      icon: <Home className="h-4 w-4" />, 
      exactMatch: true, 
      group: 'core',
      // removed hotkey: '⌘D',
      description: 'Today\'s focus and analytics',
      widget: {
        value: '$2.4M',
        trend: 'up',
        subtitle: 'This month'
      }
    },
    { 
      href: "/app/inbox", 
      label: "Inbox", 
      icon: <Inbox className="h-4 w-4" />, 
      badge: 12,
      badgeColor: 'destructive',
      group: 'core',
      // removed hotkey: '⌘I',
      description: 'AI-powered email management',
      widget: {
        value: 5,
        subtitle: 'Hot leads'
      }
    },
    {
      href: "/app/pipeline",
      label: "Pipeline",
      icon: <GitBranch className="h-4 w-4" />,
      badge: 8,
      badgeColor: 'warning',
      group: 'core',
      // removed hotkey: '⌘P',
      description: 'Sales pipeline kanban',
      widget: {
        value: '24%',
        trend: 'up',
        subtitle: 'Close rate'
      }
    },
    {
      href: "/app/contacts",
      label: "Contacts",
      icon: <Users className="h-4 w-4" />,
      badge: 3,
      badgeColor: 'warning',
      group: 'core',
      // removed hotkey: '⌘C',
      description: 'Client and contact management',
      widget: {
        value: 348,
        subtitle: 'Total contacts'
      }
    },
    {
      href: "/app/calendar",
      label: "Calendar",
      icon: <Calendar className="h-4 w-4" />,
      badge: 6,
      badgeColor: 'success',
      group: 'core',
      // removed hotkey: '⌘S',
      description: 'Schedule meetings and showings',
      widget: {
        value: 3,
        subtitle: 'Today'
      }
    },
    {
      href: "/app/tasks",
      label: "Tasks",
      icon: <Clock className="h-4 w-4" />,
      badge: 2,
      badgeColor: 'warning',
      group: 'core',
      // removed hotkey: '⌘T',
      description: 'Task and reminder management'
    },
    { 
      href: "/app/chat", 
      label: "AI Assistant", 
      icon: <MessageSquare className="h-4 w-4" />, 
      badge: 1,
      badgeColor: 'default',
      group: 'core',
      // removed hotkey: '⌘A',
      description: 'AI-powered assistance'
    },
    {
      href: "/app/documents",
      label: "Documents",
      icon: <FileText className="h-4 w-4" />,
      group: 'core',
      description: 'Document templates and management'
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
      // removed hotkey: '⌘,',
      description: 'App settings and preferences'
    }
  ];

  const quickActions = [
    { 
      label: "Add Lead", 
      icon: <Star className="h-4 w-4" />, 
      action: () => window.location.href = '/app/pipeline/create',
      // removed hotkey: '⌘N'
    },
    { 
      label: "Compose Email", 
      icon: <Mail className="h-4 w-4" />, 
      action: () => window.location.href = '/app/inbox/compose',
      // removed hotkey: '⌘E'
    },
    { 
      label: "Schedule Meeting", 
      icon: <Calendar className="h-4 w-4" />, 
      action: () => window.location.href = '/app/calendar?action=create',
      // removed hotkey: '⌘M'
    },
    { 
      label: "Add Task", 
      icon: <Clock className="h-4 w-4" />, 
      action: () => window.location.href = '/app/tasks?action=create',
      // removed hotkey: '⌘T'
    },
    { 
      label: "Add Contact", 
      icon: <User className="h-4 w-4" />, 
      action: () => window.location.href = '/app/contacts?action=create',
      // removed hotkey: '⌘K'
    }
  ];

  const groupedItems = {
    core: navItems.filter(item => item.group === 'core'),
    utilities: navItems.filter(item => item.group === 'utilities'),
  };

  // Fixed route matching logic
  const isActive = (item: NavItem) => {
    if (item.exactMatch) {
      return pathname === item.href;
    }
    // For nested routes, check if pathname starts with href + '/'
    // But never activate on partials (e.g., /inbox-archive shouldn't activate /inbox)
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

  const getBadgeVariant = (color: string) => {
    switch (color) {
      case 'destructive': return 'destructive';
      case 'warning': return 'secondary';
      case 'success': return 'outline';
      default: return 'default';
    }
  };

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'destructive': return 'bg-red-500 text-white';
      case 'warning': return 'bg-yellow-500 text-black';
      case 'success': return 'bg-green-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getNotificationCount = () => {
    return notifications.reduce((sum, notif) => sum + notif.count, 0);
  };

  return (
    <TooltipProvider>
      <aside 
        className={`
          sticky top-0 h-screen hidden md:flex md:flex-col 
          theme-sidebar z-40
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-[72px]' : 'w-[280px]'}
          relative overflow-hidden
          ${isCollapsed ? 'hover:w-[280px] hover:shadow-xl group' : ''}
          backdrop-blur-sm
        `}
        style={{
          backgroundColor: currentTheme.colors.surfaceAlt,
          borderRight: `1px solid ${currentTheme.colors.border}`,
          backdropFilter: 'blur(8px)'
        }}
      >
        {/* Enhanced River Flow Background Effect with Performance Optimization */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          <div 
            className="absolute inset-y-0 left-0 w-1"
            style={{
              background: `linear-gradient(to bottom, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary}, ${currentTheme.colors.accent})`,
              animation: 'pulse 3s ease-in-out infinite'
            }}
          ></div>
          <div 
            className="absolute inset-y-0 left-4 w-0.5" 
            style={{ 
              background: `linear-gradient(to bottom, transparent, ${currentTheme.colors.primary}60, transparent)`,
              animation: 'pulse 4s ease-in-out infinite 1s'
            }}
          ></div>
          <div 
            className="absolute inset-y-0 left-8 w-0.5" 
            style={{ 
              background: `linear-gradient(to bottom, transparent, ${currentTheme.colors.secondary}60, transparent)`,
              animation: 'pulse 5s ease-in-out infinite 2s'
            }}
          ></div>
          {/* Subtle floating particles */}
          <div 
            className="absolute top-1/4 left-12 w-1 h-1 rounded-full opacity-40"
            style={{ 
              backgroundColor: currentTheme.colors.accent,
              animation: 'float 6s ease-in-out infinite'
            }}
          ></div>
          <div 
            className="absolute top-3/4 left-16 w-0.5 h-0.5 rounded-full opacity-40"
            style={{ 
              backgroundColor: currentTheme.colors.primary,
              animation: 'float 8s ease-in-out infinite 3s'
            }}
          ></div>
        </div>
        
        {/* Custom animations */}
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}</style>

        {/* Enhanced Header with Premium Logo and Branding */}
        <div 
          className="relative z-10 h-16 flex items-center px-4"
          style={{
            borderBottom: `1px solid ${currentTheme.colors.border}`,
            background: `linear-gradient(135deg, ${currentTheme.colors.background} 0%, color-mix(in oklab, ${currentTheme.colors.background} 95%, ${currentTheme.colors.primary}) 100%)`
          }}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3 flex-1">
              <Link href="/app" className="flex items-center gap-3 group">
                <div className="relative">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`
                    }}
                  >
                    <span className="text-white font-bold text-base tracking-tight">R</span>
                  </div>
                  <div 
                    className="absolute -inset-1 rounded-xl opacity-20 blur-sm transition-opacity group-hover:opacity-30"
                    style={{
                      background: currentTheme.colors.gradient
                    }}
                  ></div>
                </div>
                <div className="flex flex-col">
                  <span 
                    className="font-bold text-xl leading-none tracking-tight transition-all group-hover:tracking-wide"
                    style={{
                      background: currentTheme.colors.gradient,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Rivor
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                    Real Estate CRM
                  </span>
                </div>
              </Link>
              
              {/* Smart Notifications Indicator */}
              <div className="flex items-center gap-2 ml-auto mr-2">
                {getNotificationCount() > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 relative"
                      >
                        <Bell className="h-4 w-4" />
                        <Badge 
                          className="absolute -top-1 -right-1 h-5 w-5 text-[10px] p-0 flex items-center justify-center animate-pulse"
                          style={{ backgroundColor: currentTheme.colors.primary }}
                        >
                          {getNotificationCount()}
                        </Badge>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <div className="space-y-1">
                        {notifications.map(notif => (
                          <div key={notif.id} className="text-xs">
                            <span className="font-medium">{notif.count}</span> {notif.message}
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-7 w-7 transition-colors hover:bg-background/50"
                aria-label="Collapse sidebar (⌘B)"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
          {isCollapsed && (
            <div className="flex items-center justify-between w-full px-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/app" className="group">
                    <div className="relative">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`
                        }}
                      >
                        <span className="text-white font-bold text-sm">R</span>
                      </div>
                      {getNotificationCount() > 0 && (
                        <Badge 
                          className="absolute -top-1 -right-1 h-4 w-4 text-[9px] p-0 flex items-center justify-center animate-pulse"
                          style={{ backgroundColor: currentTheme.colors.primary }}
                        >
                          {getNotificationCount()}
                        </Badge>
                      )}
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="text-center">
                    <p className="font-semibold">Rivor</p>
                    <p className="text-xs text-muted-foreground">Real Estate CRM</p>
                    {getNotificationCount() > 0 && (
                      <div className="mt-2 space-y-1">
                        {notifications.map(notif => (
                          <div key={notif.id} className="text-xs">
                            <span className="font-medium">{notif.count}</span> {notif.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleCollapse}
                    aria-label="Expand sidebar"
                    className="h-6 w-6 opacity-70 hover:opacity-100 transition-all hover:scale-105"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Expand sidebar</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Container */}
        <div className="flex-1 relative overflow-hidden">
          {/* Scrollable Content - Optimized spacing */}
          <nav
            className="sidebar-nav h-full overflow-y-auto py-3 space-y-2 relative z-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30 hover:scrollbar-thumb-border/50"
            aria-label="Main navigation"
            role="navigation"
          >
            {/* Core Workflows - Enhanced header */}
            <div>
              {!isCollapsed && (
                <div className="px-3 py-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-0.5 flex-1 rounded-full"
                      style={{ background: `linear-gradient(90deg, ${currentTheme.colors.primary}40, transparent)` }}
                    ></div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                      Core Workflows
                    </span>
                    <div 
                      className="h-0.5 flex-1 rounded-full"
                      style={{ background: `linear-gradient(90deg, transparent, ${currentTheme.colors.primary}40)` }}
                    ></div>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                {groupedItems.core.map((item) => {
                  const active = isActive(item);
                  return (
                    <Tooltip key={item.href} disableHoverableContent={!isCollapsed}>
                      <TooltipTrigger asChild>
                        <Link 
                          href={item.href} 
                          aria-current={active ? "page" : undefined}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 text-sm font-medium
                            hover:bg-background/50 transition-all duration-300 
                            rounded-lg mx-2 relative group border border-transparent
                            ${active 
                              ? `border-primary/20 shadow-lg` 
                              : "hover:border-border/50 hover:shadow-sm"
                            }
                          `}
                          style={{
                            background: active 
                              ? `linear-gradient(135deg, ${currentTheme.colors.primary}08, ${currentTheme.colors.secondary}05)` 
                              : 'transparent',
                            color: active ? currentTheme.colors.primary : 'inherit'
                          }}
                        >
                          {/* Enhanced Active State Effect */}
                          {active && (
                            <>
                              <motion.div
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                                style={{ background: currentTheme.colors.gradient }}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 24, opacity: 1 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                              />
                              <div 
                                className="absolute inset-0 rounded-lg opacity-20"
                                style={{ background: currentTheme.colors.gradient }}
                              ></div>
                            </>
                          )}
                          
                          <div className="relative z-10 flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <span className={`transition-all duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                                {item.icon}
                              </span>
                              {!isCollapsed && (
                                <div className="flex flex-col">
                                  <span className="leading-none">{item.label}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Enhanced badges with color coding */}
                            <div className="flex items-center gap-1">
                              {item.badge && item.badge > 0 && (
                                <Badge 
                                  className={`
                                    text-[10px] px-1.5 py-0.5 min-w-[18px] h-5 rounded-full font-bold
                                    ${isCollapsed ? 'absolute -top-1 -right-1' : ''}
                                    ${getBadgeColor(item.badgeColor || 'default')}
                                  `}
                                  aria-label={`${item.badge} items in ${item.label}`}
                                >
                                  {item.badge > 99 ? '99+' : item.badge}
                                </Badge>
                              )}
                              
                              {/* Mini widget for expanded sidebar */}
                              {!isCollapsed && item.widget && (
                                <div className="text-right">
                                  <div className="text-xs font-semibold leading-none">
                                    {item.widget.value}
                                  </div>
                                  {item.widget.subtitle && (
                                    <div className="text-[10px] text-muted-foreground leading-none mt-0.5">
                                      {item.widget.subtitle}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {item.icon}
                              <span className="font-medium">{item.label}</span>
                              {item.badge && item.badge > 0 && (
                                <Badge 
                                  className={`text-[10px] px-1.5 py-0.5 ${getBadgeColor(item.badgeColor || 'default')}`}
                                >
                                  {item.badge > 99 ? '99+' : item.badge}
                                </Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                            {item.widget && (
                              <div className="text-xs border-t pt-2">
                                <div className="font-semibold">{item.widget.value}</div>
                                {item.widget.subtitle && (
                                  <div className="text-muted-foreground">{item.widget.subtitle}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Floating Action Button - Space saving */}

            {/* Utilities - Enhanced section */}
            <div className="mt-6">
              {!isCollapsed && (
                <div className="px-3 py-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-0.5 flex-1 rounded-full"
                      style={{ background: `linear-gradient(90deg, ${currentTheme.colors.secondary}40, transparent)` }}
                    ></div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                      Utilities
                    </span>
                    <div 
                      className="h-0.5 flex-1 rounded-full"
                      style={{ background: `linear-gradient(90deg, transparent, ${currentTheme.colors.secondary}40)` }}
                    ></div>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                {groupedItems.utilities.map((item) => {
                  const active = isActive(item);
                  return (
                    <Tooltip key={item.href} disableHoverableContent={!isCollapsed}>
                      <TooltipTrigger asChild>
                        <Link 
                          href={item.href} 
                          aria-current={active ? "page" : undefined}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 text-sm font-medium
                            hover:bg-background/50 transition-all duration-300 
                            rounded-lg mx-2 relative group border border-transparent
                            ${active 
                              ? `border-primary/20 shadow-lg` 
                              : "hover:border-border/50 hover:shadow-sm"
                            }
                          `}
                          style={{
                            background: active 
                              ? `linear-gradient(135deg, ${currentTheme.colors.primary}08, ${currentTheme.colors.secondary}05)` 
                              : 'transparent',
                            color: active ? currentTheme.colors.primary : 'inherit'
                          }}
                        >
                          {/* Active State Effect */}
                          {active && (
                            <motion.div
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                              style={{ background: currentTheme.colors.gradient }}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 24, opacity: 1 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                          )}
                          
                          <div className="relative z-10 flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <span className={`transition-all duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                                {item.icon}
                              </span>
                              {!isCollapsed && (
                                <div className="flex flex-col">
                                  <span className="leading-none">{item.label}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {item.icon}
                              <span className="font-medium">{item.label}</span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Quick Actions for collapsed mode */}
        {isCollapsed && (
          <div className="relative z-10 px-2 pb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-full h-8 rounded-lg hover:scale-105 transition-all duration-200"
                  style={{
                    backgroundColor: currentTheme.colors.primary,
                    borderColor: currentTheme.colors.primary,
                    color: currentTheme.colors.textInverse
                  }}
                  onClick={() => setShowQuickActionsMenu(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Quick Actions</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Compact Footer Accordion - Theme + Profile/Help/Logout */}
        <div 
          className="relative z-10 mt-2"
          style={{
            borderTop: `1px solid ${currentTheme.colors.border}`,
            background: `linear-gradient(135deg, ${currentTheme.colors.background} 0%, color-mix(in oklab, ${currentTheme.colors.background} 98%, ${currentTheme.colors.primary}) 100%)`
          }}
        >
          {!isCollapsed ? (
            <div className="p-2 space-y-2">
              {/* Accordion Header */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFooterExpanded(!isFooterExpanded)}
                className="w-full justify-between h-8 px-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback 
                      className="text-white font-bold text-xs"
                      style={{ background: currentTheme.colors.gradient }}
                    >
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate">
                    {session?.user?.name?.split(' ')[0] || 'User'}
                  </span>
                </div>
                {isFooterExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              
              {/* Expanded Content */}
              <AnimatePresence>
                {isFooterExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2 overflow-hidden"
                  >
                    {/* Theme Switcher */}
                    <div className="px-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Palette className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Theme</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs flex-col py-1 px-2">
                        <User className="h-3 w-3" />
                        <span className="text-[10px] mt-0.5">Profile</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs flex-col py-1 px-2">
                        <HelpCircle className="h-3 w-3" />
                        <span className="text-[10px] mt-0.5">Help</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs flex-col py-1 px-2 text-muted-foreground hover:text-destructive">
                        <LogOut className="h-3 w-3" />
                        <span className="text-[10px] mt-0.5">Logout</span>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-2 flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-7 w-7 cursor-pointer hover:scale-110 transition-transform">
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback 
                      className="text-white font-bold text-xs"
                      style={{ background: currentTheme.colors.gradient }}
                    >
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium">{session?.user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <User className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <HelpCircle className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <LogOut className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
              
            </div>
          )}
        </div>

      </aside>

      {/* Quick Actions Menu - Positioned to the right of sidebar */}
      {showQuickActionsMenu && (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowQuickActionsMenu(false)}>
          <div 
            className={`quick-actions-menu absolute top-16 shadow-2xl rounded-xl border p-4 min-w-[280px] ${
              isCollapsed ? 'left-[88px]' : 'left-[272px]'
            }`}
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3">
              <h3 
                className="font-semibold text-sm mb-1"
                style={{ color: currentTheme.colors.textPrimary }}
              >
                Quick Actions
              </h3>
              <p 
                className="text-xs"
                style={{ color: currentTheme.colors.textMuted }}
              >
                Fast access to common tasks
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-16 flex flex-col gap-2 hover:scale-105 transition-all"
                onClick={() => {
                  window.location.href = '/app/pipeline/create';
                  setShowQuickActionsMenu(false);
                }}
              >
                <GitBranch className="h-5 w-5" />
                <span className="text-xs">New Deal</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="h-16 flex flex-col gap-2 hover:scale-105 transition-all"
                onClick={() => {
                  window.location.href = '/app/contacts?action=create';
                  setShowQuickActionsMenu(false);
                }}
              >
                <Users className="h-5 w-5" />
                <span className="text-xs">Add Contact</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="h-16 flex flex-col gap-2 hover:scale-105 transition-all"
                onClick={() => {
                  window.location.href = '/app/calendar?action=create';
                  setShowQuickActionsMenu(false);
                }}
              >
                <Calendar className="h-5 w-5" />
                <span className="text-xs">Schedule</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="h-16 flex flex-col gap-2 hover:scale-105 transition-all"
                onClick={() => {
                  window.location.href = '/app/inbox/compose';
                  setShowQuickActionsMenu(false);
                }}
              >
                <Mail className="h-5 w-5" />
                <span className="text-xs">Send Email</span>
              </Button>
            </div>
          </div>
        </div>
      )}

    </TooltipProvider>
  );
}
