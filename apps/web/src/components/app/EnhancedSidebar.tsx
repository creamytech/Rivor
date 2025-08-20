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
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
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
  Archive
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exactMatch?: boolean;
  badge?: number;
  badgeColor?: 'default' | 'destructive' | 'warning' | 'success';
  group: 'core' | 'utilities' | 'quick-actions';
  hotkey?: string;
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

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle sidebar
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        onToggleCollapse();
        return;
      }

      // Navigation shortcuts
      if (event.metaKey || event.ctrlKey) {
        const shortcuts: { [key: string]: string } = {
          'd': '/app',
          'i': '/app/inbox',
          'p': '/app/pipeline',
          'r': '/app/properties',
          's': '/app/showings',
          'm': '/app/insights',
          'c': '/app/contacts',
          'a': '/app/chat',
          ',': '/app/settings'
        };

        if (shortcuts[event.key]) {
          event.preventDefault();
          window.location.href = shortcuts[event.key];
          return;
        }

        // Quick actions shortcuts
        const quickShortcuts: { [key: string]: () => void } = {
          'n': () => window.location.href = '/app/pipeline/create',
          't': () => window.location.href = '/app/showings/new',
          'k': () => window.location.href = '/app/properties/new',
          'e': () => window.location.href = '/app/inbox/compose',
          'l': () => window.location.href = '/app/contacts'
        };

        if (quickShortcuts[event.key]) {
          event.preventDefault();
          quickShortcuts[event.key]();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCollapse]);

  // Enhanced navigation items with real estate-specific features
  const navItems: NavItem[] = [
    // Core Workflows
    { 
      href: "/app", 
      label: "Dashboard", 
      icon: <Home className="h-4 w-4" />, 
      exactMatch: true, 
      group: 'core',
      hotkey: '⌘D',
      description: 'Overview and key metrics',
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
      hotkey: '⌘I',
      description: 'Email and messages',
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
      hotkey: '⌘P',
      description: 'Sales pipeline management',
      widget: {
        value: '24%',
        trend: 'up',
        subtitle: 'Close rate'
      }
    },
    {
      href: "/app/properties",
      label: "Properties",
      icon: <Building2 className="h-4 w-4" />,
      badge: 47,
      badgeColor: 'default',
      group: 'core',
      hotkey: '⌘R',
      description: 'Property listings and details',
      widget: {
        value: 127,
        subtitle: 'Active listings'
      }
    },
    {
      href: "/app/showings",
      label: "Showings",
      icon: <Calendar className="h-4 w-4" />,
      badge: 6,
      badgeColor: 'success',
      group: 'core',
      hotkey: '⌘S',
      description: 'Schedule and manage showings',
      widget: {
        value: 3,
        subtitle: 'Today'
      }
    },
    {
      href: "/app/insights",
      label: "Market Insights",
      icon: <TrendingUp className="h-4 w-4" />,
      group: 'core',
      hotkey: '⌘M',
      description: 'Market trends and analytics',
      widget: {
        value: '↗ 12%',
        trend: 'up',
        subtitle: 'Avg. price'
      }
    },
    {
      href: "/app/contacts",
      label: "Contacts",
      icon: <Users className="h-4 w-4" />,
      badge: 3,
      badgeColor: 'warning',
      group: 'core',
      hotkey: '⌘C',
      description: 'Client and contact management',
      widget: {
        value: 348,
        subtitle: 'Total contacts'
      }
    },
    { 
      href: "/app/chat", 
      label: "AI Assistant", 
      icon: <MessageSquare className="h-4 w-4" />, 
      badge: 1,
      badgeColor: 'default',
      group: 'core',
      hotkey: '⌘A',
      description: 'AI-powered assistance'
    },
    
    // Utilities
    { 
      href: "/app/settings", 
      label: "Settings", 
      icon: <Settings className="h-4 w-4" />, 
      group: 'utilities',
      hotkey: '⌘,',
      description: 'App settings and preferences'
    },
    { 
      href: "/app/integrations", 
      label: "Integrations", 
      icon: <Zap className="h-4 w-4" />, 
      group: 'utilities',
      description: 'Third-party app connections'
    },
    {
      href: "/app/reports",
      label: "Reports",
      icon: <FileText className="h-4 w-4" />,
      group: 'utilities',
      description: 'Analytics and reporting'
    }
  ];

  const quickActions = [
    { 
      label: "Add Lead", 
      icon: <Star className="h-4 w-4" />, 
      action: () => window.location.href = '/app/pipeline/create',
      hotkey: '⌘N'
    },
    { 
      label: "Schedule Showing", 
      icon: <Calendar className="h-4 w-4" />, 
      action: () => window.location.href = '/app/showings/new',
      hotkey: '⌘T'
    },
    { 
      label: "Add Property", 
      icon: <Building2 className="h-4 w-4" />, 
      action: () => window.location.href = '/app/properties/new',
      hotkey: '⌘K'
    },
    { 
      label: "Compose Email", 
      icon: <Mail className="h-4 w-4" />, 
      action: () => window.location.href = '/app/inbox/compose',
      hotkey: '⌘E'
    },
    { 
      label: "Quick Call", 
      icon: <Phone className="h-4 w-4" />, 
      action: () => window.location.href = '/app/contacts',
      hotkey: '⌘L'
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
          backgroundColor: `color-mix(in oklab, ${currentTheme.colors.background} 98%, transparent)`,
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
            <div className="flex flex-col items-center gap-2 w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/app" className="group">
                    <div className="relative">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg"
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
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                aria-label="Expand sidebar (⌘B)"
                className="h-6 w-6 opacity-70 hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
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
                                  {item.hotkey && (
                                    <span className="text-[10px] text-muted-foreground mt-0.5">
                                      {item.hotkey}
                                    </span>
                                  )}
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
                            {item.hotkey && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>Shortcut:</span>
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {item.hotkey}
                                </Badge>
                              </div>
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

            {/* Enhanced Quick Actions with Real Estate Focus */}
            {!isCollapsed && (
              <div className="px-3 py-3 mt-4">
                <div 
                  className="p-3 rounded-xl border border-border/50 shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.colors.background} 0%, color-mix(in oklab, ${currentTheme.colors.background} 97%, ${currentTheme.colors.primary}) 100%)`
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Quick Actions</span>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowQuickActionsMenu(true)}
                    className="w-full h-9 font-medium shadow-sm hover:shadow-md transition-all"
                    style={{
                      background: currentTheme.colors.gradient,
                      border: 'none'
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Action
                  </Button>
                  <div className="flex items-center justify-center mt-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      ⌘N • ⌘T • ⌘K • ⌘E • ⌘L
                    </span>
                  </div>
                </div>
              </div>
            )}

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
                                  {item.hotkey && (
                                    <span className="text-[10px] text-muted-foreground mt-0.5">
                                      {item.hotkey}
                                    </span>
                                  )}
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
                            {item.hotkey && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>Shortcut:</span>
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {item.hotkey}
                                </Badge>
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
          </nav>
        </div>

        {/* Floating Quick Actions Button (when collapsed) - Enhanced */}
        {isCollapsed && (
          <div className="relative z-10 px-2 pb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  onClick={() => setShowQuickActionsMenu(true)}
                  className="w-full h-10 relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: currentTheme.colors.gradient
                  }}
                >
                  <Plus className="h-4 w-4 relative z-10" />
                  <div 
                    className="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity"
                    style={{ background: 'white' }}
                  ></div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-medium">Quick Actions</p>
                  <div className="text-xs space-y-1">
                    {quickActions.slice(0, 3).map((action, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {action.icon}
                          <span>{action.label}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {action.hotkey}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Theme Switcher - Enhanced */}
        <div className="relative z-10 px-3 py-2">
          {!isCollapsed ? (
            <div 
              className="p-2 rounded-lg border border-border/30"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.colors.background} 0%, color-mix(in oklab, ${currentTheme.colors.background} 97%, ${currentTheme.colors.primary}) 100%)`
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Palette className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Theme
                </span>
              </div>
              <ThemeSwitcher showInNavigation compact />
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <div 
                    className="p-2 rounded-lg border border-border/30"
                    style={{
                      background: `linear-gradient(135deg, ${currentTheme.colors.background} 0%, color-mix(in oklab, ${currentTheme.colors.background} 97%, ${currentTheme.colors.primary}) 100%)`
                    }}
                  >
                    <ThemeSwitcher showInNavigation compact />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <span>Switch Theme</span>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Enhanced User Profile Section */}
        <div 
          className="relative z-10 p-3 mt-2"
          style={{
            borderTop: `1px solid ${currentTheme.colors.border}`,
            background: `linear-gradient(135deg, ${currentTheme.colors.background} 0%, color-mix(in oklab, ${currentTheme.colors.background} 98%, ${currentTheme.colors.primary}) 100%)`
          }}
        >
          {!isCollapsed ? (
            <div className="space-y-3">
              {/* User Info Card */}
              <div 
                className="p-3 rounded-lg border border-border/30 hover:border-border/50 transition-all cursor-pointer group"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.colors.background} 0%, color-mix(in oklab, ${currentTheme.colors.background} 97%, ${currentTheme.colors.primary}) 100%)`
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm">
                      <AvatarImage src={session?.user?.image || ''} />
                      <AvatarFallback 
                        className="text-white font-bold text-sm"
                        style={{ background: currentTheme.colors.gradient }}
                      >
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center"
                      style={{ backgroundColor: currentTheme.colors.primary }}
                    >
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session?.user?.email || 'user@rivor.com'}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1 h-1 rounded-full bg-green-400"></div>
                      <span className="text-[10px] text-muted-foreground">Online</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex-1 h-8">
                      <User className="h-3 w-3 mr-1" />
                      Profile
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View and edit profile</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex-1 h-8">
                      <HelpCircle className="h-3 w-3 mr-1" />
                      Help
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Get help and support</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <LogOut className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sign out</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative cursor-pointer group">
                    <Avatar className="h-8 w-8 border-2 border-primary/20 shadow-sm transition-all group-hover:scale-110">
                      <AvatarImage src={session?.user?.image || ''} />
                      <AvatarFallback 
                        className="text-white font-bold text-xs"
                        style={{ background: currentTheme.colors.gradient }}
                      >
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-background flex items-center justify-center"
                      style={{ backgroundColor: currentTheme.colors.primary }}
                    >
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <div className="text-center space-y-2">
                    <div className="space-y-1">
                      <p className="font-semibold">{session?.user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-green-400"></div>
                        <span className="text-[10px] text-muted-foreground">Online</span>
                      </div>
                    </div>
                    <div className="flex gap-1 justify-center pt-2 border-t">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <User className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <HelpCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                    <LogOut className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Quick Actions Menu Modal - Works for both collapsed and expanded */}
        <AnimatePresence>
          {showQuickActionsMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`absolute ${isCollapsed ? 'bottom-16 left-2 right-2' : 'bottom-20 left-3 right-3'} bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-2xl z-50 p-3 quick-actions-menu`}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.colors.background} 0%, color-mix(in oklab, ${currentTheme.colors.background} 95%, ${currentTheme.colors.primary}) 100%)`
              }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Quick Actions</span>
                </div>
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      action.action();
                      setShowQuickActionsMenu(false);
                    }}
                    className="w-full justify-between text-sm h-10 rounded-lg hover:bg-background/80 group transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="group-hover:scale-110 transition-transform">
                        {action.icon}
                      </span>
                      <span className="font-medium">{action.label}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-[10px] px-2 py-0.5 bg-background/50 group-hover:bg-background"
                    >
                      {action.hotkey}
                    </Badge>
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </TooltipProvider>
  );
}
