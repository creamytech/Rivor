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
import { 
  Search, 
  BarChart3, 
  Inbox, 
  GitBranch, 
  Calendar, 
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
  ExternalLink
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
  const [searchQuery, setSearchQuery] = useState("");

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
      href: "/app/calendar", 
      label: "Calendar", 
      icon: <Calendar className="h-4 w-4" />, 
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

  const isActive = (item: NavItem) => {
    return item.exactMatch 
      ? pathname === item.href 
      : pathname === item.href || pathname.startsWith(item.href + '/');
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

  const getActiveItemPosition = () => {
    // Calculate position based on active item
    const activeItem = navItems.find(item => isActive(item));
    if (!activeItem) return 80; // Default position after header
    
    const itemIndex = navItems.findIndex(item => isActive(item));
    const headerHeight = 56; // h-14
    const itemHeight = 40; // h-10
    const searchHeight = 72; // p-3 + input height
    
    return headerHeight + searchHeight + (itemIndex * itemHeight) + 8; // 8px offset
  };

  return (
    <TooltipProvider>
      <aside className={`
        sticky top-0 h-screen hidden md:flex md:flex-col 
        border-r border-[var(--border)] bg-[var(--muted)] z-40
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        relative overflow-hidden
      `}>
        {/* Enhanced River Flow Background Effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-400 via-cyan-400 to-teal-400 animate-pulse"></div>
          <div className="absolute inset-y-0 left-4 w-0.5 bg-gradient-to-b from-transparent via-blue-300 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-y-0 left-8 w-0.25 bg-gradient-to-b from-transparent via-cyan-300 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Active Section Glow Effect */}
        <AnimatePresence>
          {pathname && (
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute left-0 w-1 h-8 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-r-full shadow-lg"
              style={{
                top: `${getActiveItemPosition()}px`,
                filter: 'blur(1px)',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
              }}
            />
          )}
        </AnimatePresence>

        {/* Header with Logo */}
        <div className="relative z-10 h-14 flex items-center px-4 border-b border-[var(--border)]">
          {!isCollapsed && (
            <Link href="/app" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-semibold text-lg bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Rivor
              </span>
            </Link>
          )}
          {isCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/app" className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-white font-bold text-sm">R</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Rivor</TooltipContent>
            </Tooltip>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="absolute right-2 h-8 w-8"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative z-10 p-3 border-b border-[var(--border)]">
          {!isCollapsed ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Search or run command..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-[var(--border)] px-1.5 py-0.5 rounded">
                ⌘K
              </div>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-full h-10">
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Search</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-6 relative z-10">
          {/* Core Workflows */}
          <div>
            {!isCollapsed && (
              <div className="px-4 mb-2">
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Core Workflows
                </span>
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
                        className={`
                          flex items-center gap-3 px-4 py-2.5 text-sm 
                          hover:bg-[var(--background)] transition-all duration-200 
                          rounded-md mx-2 relative group
                          ${active 
                            ? "bg-gradient-to-r from-blue-500/10 to-teal-500/10 text-blue-600 dark:text-blue-400 border-r-2 border-blue-500" 
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          }
                        `}
                      >
                        {/* Active State Glow Effect */}
                        {active && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-teal-500/5 rounded-md"
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
                        
                        {/* Badge */}
                        {item.badge && (
                          <Badge 
                            variant="destructive" 
                            className={`
                              ml-auto text-xs px-1.5 py-0.5 min-w-[20px] h-5
                              ${isCollapsed ? 'absolute -top-1 -right-1' : ''}
                            `}
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
                          {item.badge && (
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

          {/* Quick Actions */}
          <div>
            {!isCollapsed && (
              <div className="px-4 mb-2">
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Quick Actions
                </span>
              </div>
            )}
            <div className="space-y-1">
              {quickActions.map((action, index) => (
                <Tooltip key={index} disableHoverableContent={!isCollapsed}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={action.action}
                      className={`
                        w-full justify-start px-4 py-2.5 text-sm
                        hover:bg-[var(--background)] transition-all duration-200
                        rounded-md mx-2
                        ${isCollapsed ? 'px-2' : ''}
                      `}
                    >
                      <span className="text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">
                        {action.icon}
                      </span>
                      {!isCollapsed && <span className="ml-3">{action.label}</span>}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <div className="flex items-center gap-2">
                        {action.icon}
                        <span>{action.label}</span>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Utilities */}
          <div>
            {!isCollapsed && (
              <div className="px-4 mb-2">
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Utilities
                </span>
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
                        className={`
                          flex items-center gap-3 px-4 py-2.5 text-sm 
                          hover:bg-[var(--background)] transition-all duration-200 
                          rounded-md mx-2
                          ${active 
                            ? "bg-gradient-to-r from-blue-500/10 to-teal-500/10 text-blue-600 dark:text-blue-400 border-r-2 border-blue-500" 
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

        {/* User Profile Section */}
        <div className="relative z-10 p-3 border-t border-[var(--border)]">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--background)] transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">
                  {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">
                  {session?.user?.email || 'user@example.com'}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white text-sm">
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
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
