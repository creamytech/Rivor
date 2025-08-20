"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Import dashboard cards
import TodayAtAGlance from './TodayAtAGlance';
import CompactSyncProgress from './CompactSyncProgress';
import LeadFeed from './LeadFeed';
import ActivityFeed from './ActivityFeed';
import HealthWidget from './HealthWidget';
import MiniPipelineSparkline from './MiniPipelineSparkline';

interface DashboardLayoutProps {
  className?: string;
}

export default function DashboardLayout({ className = '' }: DashboardLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-muted/50 rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 bg-muted/50 rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-96 bg-muted/50 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Top Row - Today at a Glance (Full Width) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full"
      >
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <TodayAtAGlance />
        </div>
      </motion.div>

      {/* Second Row - Three Equal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="h-64 p-4">
            <CompactSyncProgress />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="h-64 p-4">
            <HealthWidget />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="h-64 p-4">
            <MiniPipelineSparkline />
          </div>
        </motion.div>
      </div>

      {/* Third Row - Two Large Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="h-96 p-4">
            <LeadFeed />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="h-96 p-4">
            <ActivityFeed />
          </div>
        </motion.div>
      </div>
    </div>
  );
}