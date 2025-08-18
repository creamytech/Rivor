"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MoreHorizontal, Filter, Bookmark, Calendar, Users, MessageSquare, Briefcase, Mail } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  metaChips?: Array<{ label: string; value: string; color?: string }>;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    icon: React.ReactNode;
  }>;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  children?: React.ReactNode; // For page-specific content like tabs/filters
  gradientColors?: {
    from: string;
    via: string;
    to: string;
  };
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  metaChips = [],
  primaryAction,
  secondaryActions = [],
  searchPlaceholder = "Search...",
  onSearch,
  children,
  gradientColors = {
    from: "from-blue-600/15",
    via: "via-indigo-600/15", 
    to: "to-purple-600/15"
  }
}: PageHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <div className="sticky top-14 z-20 bg-[color-mix(in_oklab,var(--background)95%,transparent)] backdrop-blur-sm border-b border-[var(--border)]">
      <AnimatePresence>
        <motion.div
          className={`relative overflow-hidden transition-all duration-300 ${
            isScrolled ? 'py-3' : 'py-6'
          }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Gradient background with reduced saturation */}
          <div className={`absolute inset-0 bg-gradient-to-r ${gradientColors.from} ${gradientColors.via} ${gradientColors.to} opacity-60`} />
          
          <div className="relative z-10 px-6">
            <div className="flex items-center justify-between">
              {/* Left: Title + Icon + Subtitle + Meta Chips */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className="text-2xl opacity-80">
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <motion.h1 
                      className={`font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--muted-foreground)] bg-clip-text text-transparent transition-all duration-300 ${
                        isScrolled ? 'text-xl' : 'text-2xl'
                      }`}
                    >
                      {title}
                    </motion.h1>
                    {subtitle && (
                      <motion.p 
                        className={`text-[var(--muted-foreground)] transition-all duration-300 ${
                          isScrolled ? 'text-sm' : 'text-base'
                        }`}
                      >
                        {subtitle}
                      </motion.p>
                    )}
                  </div>
                </div>
                
                {/* Meta Chips */}
                {metaChips.length > 0 && (
                  <div className="flex items-center gap-2 ml-4">
                    {metaChips.map((chip, index) => (
                      <Badge 
                        key={index}
                        variant="secondary" 
                        className={`text-xs px-2 py-1 ${
                          chip.color ? `bg-${chip.color}/10 text-${chip.color}` : ''
                        }`}
                      >
                        {chip.label} {chip.value}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Center: Search (when relevant) */}
              {onSearch && (
                <div className="flex-1 max-w-md mx-6">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                    <input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[var(--muted)] border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:border-transparent"
                    />
                  </form>
                </div>
              )}

              {/* Right: Primary CTA + Secondary Icons */}
              <div className="flex items-center gap-2">
                {secondaryActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="icon"
                    onClick={action.onClick}
                    className="h-8 w-8"
                    title={action.label}
                  >
                    {action.icon}
                  </Button>
                ))}
                
                {primaryAction && (
                  <Button
                    onClick={primaryAction.onClick}
                    className="h-8 px-3 text-sm"
                  >
                    {primaryAction.icon && (
                      <span className="mr-2">{primaryAction.icon}</span>
                    )}
                    {primaryAction.label}
                  </Button>
                )}
              </div>
            </div>

            {/* Page-specific content (tabs, filters, etc.) */}
            {children && (
              <motion.div
                className="mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {children}
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
