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
  Palette
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exactMatch?: boolean;
  badge?: number;
  group: 'core' | 'utilities' | 'quick-actions';
}

interface EnhancedSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function EnhancedSidebar({ isCollapsed, onToggleCollapse }: EnhancedSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showQuickActionsMenu, setShowQuickActionsMenu] = useState(false);
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

  // Keyboard shortcut to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        onToggleCollapse();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCollapse]);

  // Navigation items with proper grouping and icons
  const navItems: NavItem[] = [
    // Core Workflows
    { 
      href: "/app", 
      label: "Dashboard", 
      icon: <BarChart3 className="h-4 w-4" />, 
      exactMatch: true, 
      group: 'core' 
    },
    { 
      href: "/app/inbox", 
      label: "Inbox", 
      icon: <Inbox className="h-4 w-4" />, 
      badge: 3, // Example badge
      group: 'core' 
    },
    {
      href: "/app/pipeline",
      label: "Pipeline",
      icon: <GitBranch className="h-4 w-4" />,
      badge: 2, // Example badge
      group: 'core'
    },
    {
      href: "/app/properties",
      label: "Properties",
      icon: <Building2 className="h-4 w-4" />,
      badge: Math.floor(Math.random() * 15) + 5,
      group: 'core'
    },
    {
      href: "/app/showings",
      label: "Showings",
      icon: <Calendar className="h-4 w-4" />,
      badge: Math.floor(Math.random() * 8) + 2,
      group: 'core'
    },
    {
      href: "/app/insights",
      label: "Market Insights",
      icon: <TrendingUp className="h-4 w-4" />,
      group: 'core'
    },
    {
      href: "/app/contacts",
      label: "Contacts",
      icon: <Users className="h-4 w-4" />,
      group: 'core'
    },
    { 
      href: "/app/chat", 
      label: "Chat", 
      icon: <MessageSquare className="h-4 w-4" />, 
      badge: 1, // Example badge
      group: 'core' 
    },
    
    // Utilities
    { 
      href: "/app/settings", 
      label: "Settings", 
      icon: <Settings className="h-4 w-4" />, 
      group: 'utilities' 
    },
    { 
      href: "/app/integrations", 
      label: "Integrations", 
      icon: <Zap className="h-4 w-4" />, 
      group: 'utilities' 
    },
  ];

  const quickActions = [
    { label: "Add Lead", icon: <Plus className="h-4 w-4" />, action: () => window.location.href = '/app/pipeline/create' },
    { label: "New Meeting", icon: <Calendar className="h-4 w-4" />, action: () => window.location.href = '/app/calendar' },
    { label: "Compose Email", icon: <Inbox className="h-4 w-4" />, action: () => window.location.href = '/app/inbox/compose' },
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

  return (
    <TooltipProvider>
      <aside 
        className={`
          sticky top-0 h-screen hidden md:flex md:flex-col 
          theme-sidebar z-40
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-[72px]' : 'w-64'}
          relative overflow-hidden
          ${isCollapsed ? 'hover:w-64 hover:shadow-xl group' : ''}
        `}
        style={{
          backgroundColor: currentTheme.colors.background,
          borderRight: `1px solid ${currentTheme.colors.border}`,
        }}
      >
        {/* Enhanced River Flow Background Effect */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-y-0 left-0 w-1 animate-pulse"
            style={{
              background: `linear-gradient(to bottom, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary}, ${currentTheme.colors.accent})`
            }}
          ></div>
          <div 
            className="absolute inset-y-0 left-4 w-0.5 animate-pulse" 
            style={{ 
              background: `linear-gradient(to bottom, transparent, ${currentTheme.colors.primary}40, transparent)`,
              animationDelay: '1s' 
            }}
          ></div>
          <div 
            className="absolute inset-y-0 left-8 w-0.5 animate-pulse" 
            style={{ 
              background: `linear-gradient(to bottom, transparent, ${currentTheme.colors.secondary}40, transparent)`,
              animationDelay: '2s' 
            }}
          ></div>
        </div>

        {/* Header with Logo and Collapse Toggle */}
        <div 
          className="relative z-10 h-14 flex items-center px-4"
          style={{
            borderBottom: `1px solid ${currentTheme.colors.border}`
          }}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2 flex-1">
              <Link href="/app" className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: currentTheme.colors.gradient
                  }}
                >
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span 
                  className="font-semibold text-lg theme-gradient-text"
                  style={{
                    background: currentTheme.colors.gradient,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Rivor
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-6 w-6 ml-auto"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
            </div>
          )}
          {isCollapsed && (
            <div className="flex items-center justify-center w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleCollapse}
                    aria-label="Expand sidebar"
                    className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center"
                  >
                    <ChevronRight className="h-3 w-3 text-white" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Expand</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Container */}
        <div className="flex-1 relative overflow-hidden">
          {/* Scrollable Content - Reduced spacing */}
          <nav
            className="sidebar-nav h-full overflow-y-auto py-2 space-y-1.5 relative z-0 scrollbar-none"
            aria-label="Main"
          >
            {/* Core Workflows - Compressed header */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-0.5">
                  <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide opacity-75">
                    Core Workflows
                  </span>
                </div>
              )}
              <div className="space-y-0">
                {groupedItems.core.map((item) => {
                  const active = isActive(item);
                  return (
                    <Tooltip key={item.href} disableHoverableContent={!isCollapsed}>
                      <TooltipTrigger asChild>
                        <Link 
                          href={item.href} 
                          aria-current={active ? "page" : undefined}
                          className={`
                            flex items-center gap-2.5 px-3 py-1.5 text-sm 
                            hover:bg-[var(--background)] transition-all duration-200 
                            rounded-md mx-1.5 relative group
                            ${active 
                              ? "bg-gradient-to-r from-blue-500/15 to-teal-500/15 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500" 
                              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            }
                          `}
                        >
                          {/* Active State Glow Effect */}
                          {active && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-blue-500/8 to-teal-500/8 rounded-md"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            />
                          )}
                          
                          <div className="relative z-10 flex items-center gap-3">
                            <span className={`transition-colors ${active ? 'text-blue-500' : ''}`}>
                              {item.icon}
                            </span>
                            {!isCollapsed && <span>{item.label}</span>}
                          </div>
                          
                          {/* Badge - compact size */}
                          {item.badge && item.badge > 0 && (
                            <Badge 
                              variant="destructive" 
                              className={`
                                ml-auto text-[10px] px-1 py-0 min-w-[16px] h-4 rounded-full
                                ${isCollapsed ? 'absolute -top-0.5 -right-0.5' : ''}
                              `}
                              aria-label={`${item.badge} new in ${item.label}`}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          <div className="flex items-center gap-2">
                            {item.icon}
                            <span>{item.label}</span>
                            {item.badge && item.badge > 0 && (
                              <Badge variant="destructive" className="text-xs px-1 py-0.5">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions - Now as floating + button only */}
            {!isCollapsed && (
              <div className="px-3 pb-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowQuickActionsMenu(true)}
                      className="w-full h-8 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Quick Actions
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add Lead, New Meeting, Compose Email</TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Utilities - Collapsible section */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-0.5">
                  <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide opacity-75">
                    Utilities
                  </span>
                </div>
              )}
              <div className="space-y-0">
                {groupedItems.utilities.map((item) => {
                  const active = isActive(item);
                  return (
                    <Tooltip key={item.href} disableHoverableContent={!isCollapsed}>
                      <TooltipTrigger asChild>
                        <Link 
                          href={item.href} 
                          aria-current={active ? "page" : undefined}
                          className={`
                            flex items-center gap-2.5 px-3 py-1.5 text-sm 
                            hover:bg-[var(--background)] transition-all duration-200 
                            rounded-md mx-1.5
                            ${active 
                              ? "bg-gradient-to-r from-blue-500/15 to-teal-500/15 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500" 
                              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            }
                          `}
                        >
                          <span className={`transition-colors ${active ? 'text-blue-500' : ''}`}>
                            {item.icon}
                          </span>
                          {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          <div className="flex items-center gap-2">
                            {item.icon}
                            <span>{item.label}</span>
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

        {/* Floating Quick Actions Button (when collapsed) - Compact */}
        {isCollapsed && (
          <div className="relative z-10 px-2 pb-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  onClick={() => setShowQuickActionsMenu(true)}
                  className="w-full h-8 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Quick Actions</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Theme Switcher */}
        <div className="relative z-10 px-2 py-2">
          {!isCollapsed ? (
            <div className="mb-2">
              <ThemeSwitcher showInNavigation compact />
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center mb-2">
                  <ThemeSwitcher showInNavigation compact />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Switch Theme</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* User Profile Section - Condensed */}
        <div 
          className="relative z-10 px-2 py-1"
          style={{
            borderTop: `1px solid ${currentTheme.colors.border}`
          }}
        >
          {!isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[var(--background)] transition-colors cursor-pointer">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--foreground)] truncate">
                      {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-4 w-4">
                    <LogOut className="h-2.5 w-2.5" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">{session?.user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-6 w-6 cursor-pointer">
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="text-center">
                    <p className="font-medium">{session?.user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="icon" className="h-4 w-4">
                <LogOut className="h-2.5 w-2.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Quick Actions Menu Modal - Works for both collapsed and expanded */}
        <AnimatePresence>
          {showQuickActionsMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`absolute ${isCollapsed ? 'bottom-16 left-2 right-2' : 'bottom-12 left-3 right-3'} bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-50 p-2 quick-actions-menu`}
            >
              <div className="space-y-1">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      action.action();
                      setShowQuickActionsMenu(false);
                    }}
                    className="w-full justify-start text-sm h-8"
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
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
