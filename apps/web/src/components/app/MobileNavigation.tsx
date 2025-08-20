"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileKeyboard } from '@/hooks/useMobileGestures';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';
import {
  BarChart3,
  Inbox,
  GitBranch,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  Menu,
  X,
  Home,
  Bell,
  Search,
  Plus,
  User,
  LogOut,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  group: 'primary' | 'secondary';
}

interface MobileNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function MobileNavigation({ isOpen, onToggle }: MobileNavigationProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { currentTheme } = useTheme();
  const [activeGroup, setActiveGroup] = useState<'primary' | 'secondary'>('primary');
  
  // Mobile optimizations
  const { shouldReduceAnimations } = useMobilePerformance();
  useMobileKeyboard();

  const navItems: NavItem[] = [
    // Primary navigation
    { 
      href: "/app", 
      label: "Dashboard", 
      icon: <BarChart3 className="h-5 w-5" />, 
      group: 'primary' 
    },
    { 
      href: "/app/inbox", 
      label: "Inbox", 
      icon: <Inbox className="h-5 w-5" />, 
      badge: 3,
      group: 'primary' 
    },
    { 
      href: "/app/pipeline", 
      label: "Pipeline", 
      icon: <GitBranch className="h-5 w-5" />, 
      badge: 2,
      group: 'primary' 
    },
    { 
      href: "/app/calendar", 
      label: "Calendar", 
      icon: <Calendar className="h-5 w-5" />, 
      group: 'primary' 
    },
    { 
      href: "/app/contacts", 
      label: "Contacts", 
      icon: <Users className="h-5 w-5" />, 
      group: 'primary' 
    },
    { 
      href: "/app/chat", 
      label: "Chat", 
      icon: <MessageSquare className="h-5 w-5" />, 
      group: 'primary' 
    },
    
    // Secondary navigation
    { 
      href: "/app/settings", 
      label: "Settings", 
      icon: <Settings className="h-5 w-5" />, 
      group: 'secondary' 
    },
  ];

  const primaryItems = navItems.filter(item => item.group === 'primary');
  const secondaryItems = navItems.filter(item => item.group === 'secondary');

  const getUserInitials = () => {
    if (!session?.user?.name && !session?.user?.email) return 'U';
    
    const name = session?.user?.name || session?.user?.email?.split('@')[0];
    return name
      ?.split(' ')
      ?.map(word => word.charAt(0))
      ?.join('')
      ?.toUpperCase()
      ?.slice(0, 2) || 'U';
  };

  const isActive = (href: string) => {
    if (href === "/app") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Close mobile nav on route change
  useEffect(() => {
    onToggle();
  }, [pathname]);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Header */}
      <header 
        className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b"
        style={{
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <div className="flex items-center justify-between h-full px-4">
          {/* Left side - Menu button and logo */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-10 w-10"
              style={{ color: currentTheme.colors.textPrimary }}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <Link href="/app" className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: currentTheme.colors.gradient }}
              >
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span 
                className="font-semibold text-lg hidden xs:block"
                style={{ color: currentTheme.colors.textPrimary }}
              >
                Rivor
              </span>
            </Link>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 relative"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              <Bell className="h-5 w-5" />
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                style={{
                  backgroundColor: currentTheme.colors.accent,
                  color: currentTheme.colors.textInverse,
                }}
              >
                3
              </Badge>
            </Button>
            
            <Avatar className="h-8 w-8">
              <AvatarFallback 
                style={{
                  background: currentTheme.colors.gradient,
                  color: 'white',
                }}
              >
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/50"
              onClick={onToggle}
            />

            {/* Navigation Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] flex flex-col"
              style={{
                backgroundColor: currentTheme.colors.background,
                borderRight: `1px solid ${currentTheme.colors.border}`,
              }}
            >
              {/* Header */}
              <div 
                className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: currentTheme.colors.border }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: currentTheme.colors.gradient }}
                  >
                    <span className="text-white font-bold text-sm">R</span>
                  </div>
                  <span 
                    className="font-semibold text-lg"
                    style={{ color: currentTheme.colors.textPrimary }}
                  >
                    Rivor
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Primary Navigation */}
                <div>
                  <h3 
                    className="text-xs font-semibold uppercase tracking-wide mb-3"
                    style={{ color: currentTheme.colors.textMuted }}
                  >
                    Navigation
                  </h3>
                  <div className="space-y-1">
                    {primaryItems.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`
                            flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                            ${active ? 'shadow-lg' : 'hover:shadow-md'}
                          `}
                          style={{
                            backgroundColor: active 
                              ? currentTheme.colors.primaryMuted 
                              : 'transparent',
                            color: active 
                              ? currentTheme.colors.primary 
                              : currentTheme.colors.textSecondary,
                          }}
                          onMouseEnter={(e) => {
                            if (!active) {
                              e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceHover;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {item.icon}
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge 
                              className="ml-auto h-5 w-5 text-xs p-0 flex items-center justify-center"
                              style={{
                                backgroundColor: currentTheme.colors.accent,
                                color: currentTheme.colors.textInverse,
                              }}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Secondary Navigation */}
                <div>
                  <h3 
                    className="text-xs font-semibold uppercase tracking-wide mb-3"
                    style={{ color: currentTheme.colors.textMuted }}
                  >
                    More
                  </h3>
                  <div className="space-y-1">
                    {secondaryItems.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`
                            flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                            ${active ? 'shadow-lg' : 'hover:shadow-md'}
                          `}
                          style={{
                            backgroundColor: active 
                              ? currentTheme.colors.primaryMuted 
                              : 'transparent',
                            color: active 
                              ? currentTheme.colors.primary 
                              : currentTheme.colors.textSecondary,
                          }}
                          onMouseEnter={(e) => {
                            if (!active) {
                              e.currentTarget.style.backgroundColor = currentTheme.colors.surfaceHover;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {item.icon}
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Theme Switcher */}
                <div>
                  <h3 
                    className="text-xs font-semibold uppercase tracking-wide mb-3"
                    style={{ color: currentTheme.colors.textMuted }}
                  >
                    Theme
                  </h3>
                  <div 
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: currentTheme.colors.surface,
                      border: `1px solid ${currentTheme.colors.border}`,
                    }}
                  >
                    <ThemeSwitcher showInNavigation compact />
                  </div>
                </div>
              </nav>

              {/* Footer - User Profile */}
              <div 
                className="p-4 border-t"
                style={{ borderColor: currentTheme.colors.border }}
              >
                <div 
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    backgroundColor: currentTheme.colors.surface,
                    border: `1px solid ${currentTheme.colors.border}`,
                  }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback 
                      style={{
                        background: currentTheme.colors.gradient,
                        color: 'white',
                      }}
                    >
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="font-medium text-sm truncate"
                      style={{ color: currentTheme.colors.textPrimary }}
                    >
                      {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p 
                      className="text-xs truncate"
                      style={{ color: currentTheme.colors.textMuted }}
                    >
                      {session?.user?.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Tab Navigation for Mobile */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t safe-area-pb"
        style={{
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
          paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {primaryItems.slice(0, 4).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0"
                style={{
                  color: active 
                    ? currentTheme.colors.primary 
                    : currentTheme.colors.textMuted,
                }}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-4 w-4 text-xs p-0 flex items-center justify-center"
                      style={{
                        backgroundColor: currentTheme.colors.accent,
                        color: currentTheme.colors.textInverse,
                      }}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium truncate max-w-[60px]">
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          {/* More button */}
          <button
            onClick={onToggle}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors"
            style={{ color: currentTheme.colors.textMuted }}
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>
    </>
  );
}