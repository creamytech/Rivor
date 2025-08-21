"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import BusinessKPIsPanel from './BusinessKPIsPanel';
import TodaysFocusPanel from './TodaysFocusPanel';
import PipelineOverviewPanel from './PipelineOverviewPanel';
import ActivityFeedPanel from './ActivityFeedPanel';
import SystemHealthStrip from './SystemHealthStrip';
import WeeklyActivityPanel from './WeeklyActivityPanel';

interface DashboardLayoutProps {
  className?: string;
}

export default function DashboardLayout({ className = '' }: DashboardLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div 
        className={cn("space-y-4 md:space-y-8 p-4 md:p-6", className)}
        style={{ background: 'var(--glass-bg)' }}
      >
        {/* Loading skeleton with glass theme */}
        <div 
          className="h-20 md:h-32 rounded-xl md:rounded-2xl animate-pulse glass-card" 
          style={{ background: 'var(--glass-surface-subtle)' }}
        />
        <div 
          className="h-32 md:h-40 rounded-xl md:rounded-2xl animate-pulse glass-card" 
          style={{ background: 'var(--glass-surface-subtle)' }}
        />
        <div 
          className="h-48 md:h-64 rounded-xl md:rounded-2xl animate-pulse glass-card" 
          style={{ background: 'var(--glass-surface-subtle)' }}
        />
        <div 
          className="h-56 md:h-80 rounded-xl md:rounded-2xl animate-pulse glass-card" 
          style={{ background: 'var(--glass-surface-subtle)' }}
        />
        <div 
          className="h-12 md:h-16 rounded-lg md:rounded-xl animate-pulse glass-card" 
          style={{ background: 'var(--glass-surface-subtle)' }}
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative ${theme === 'black' ? 'glass-theme-black' : 'glass-theme-white'}`}
      style={{
        background: 'var(--glass-bg)'
      }}
    >

      {/* Main Story Flow - Mobile optimized spacing */}
      <div className={cn("space-y-4 md:space-y-8 p-4 md:p-6 max-w-7xl mx-auto", className)}>
        {/* Chapter 1: Business Performance Overview */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-blue-500 to-teal-500 rounded-full" />
          <BusinessKPIsPanel />
        </motion.section>

        {/* Flow Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="h-px"
          style={{ 
            background: `linear-gradient(to right, transparent, var(--glass-border), transparent)` 
          }}
        />

        {/* Chapter 2: Today's Priorities */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
          <TodaysFocusPanel />
        </motion.section>

        {/* Flow Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="h-px"
          style={{ 
            background: `linear-gradient(to right, transparent, var(--glass-border), transparent)` 
          }}
        />

        {/* Chapter 3: Pipeline Insights */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
          <PipelineOverviewPanel />
        </motion.section>

        {/* Flow Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="h-px"
          style={{ 
            background: `linear-gradient(to right, transparent, var(--glass-border), transparent)` 
          }}
        />

        {/* Chapter 4: Live Activity Stream */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
          <ActivityFeedPanel />
        </motion.section>

        {/* Flow Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="h-px"
          style={{ 
            background: `linear-gradient(to right, transparent, var(--glass-border), transparent)` 
          }}
        />

        {/* Chapter 5: Weekly Activity Overview */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
          <WeeklyActivityPanel />
        </motion.section>

        {/* Flow Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="h-px"
          style={{ 
            background: `linear-gradient(to right, transparent, var(--glass-border), transparent)` 
          }}
        />

        {/* Chapter 6: System Health Footer */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
        >
          <SystemHealthStrip />
        </motion.section>
      </div>
    </div>
  );
}