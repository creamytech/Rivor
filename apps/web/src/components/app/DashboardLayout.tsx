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
import FloatingActionButton from './FloatingActionButton';
import WeeklyActivityPanel from './WeeklyActivityPanel';

interface DashboardLayoutProps {
  className?: string;
}

export default function DashboardLayout({ className = '' }: DashboardLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { currentTheme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className={cn("space-y-8 p-6", className)}>
        {/* Loading skeleton with story-driven layout */}
        <div className="h-32 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 to-slate-900 rounded-2xl animate-pulse" />
        <div className="h-40 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 to-slate-900 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 to-slate-900 rounded-2xl animate-pulse" />
        <div className="h-80 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 to-slate-900 rounded-2xl animate-pulse" />
        <div className="h-16 bg-gradient-to-r from-orange-50 to-red-50 dark:from-slate-800 to-slate-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div 
      className="relative min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${currentTheme.colors.background} 0%, ${currentTheme.colors.backgroundSecondary} 50%, ${currentTheme.colors.backgroundTertiary} 100%)`
      }}
    >
      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-20">
        <FloatingActionButton />
      </div>

      {/* Main Story Flow */}
      <div className={cn("space-y-8 p-6 max-w-7xl mx-auto", className)}>
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
          className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"
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
          className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"
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
          className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"
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
          className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"
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
          className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"
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