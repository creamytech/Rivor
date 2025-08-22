"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useMobileGestures } from "@/hooks/useMobileGestures";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronRight,
  Activity,
  Target,
  Clock,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardProps {
  className?: string;
}

interface KPI {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

interface RecentActivity {
  id: string;
  type: 'deal' | 'contact' | 'email' | 'meeting';
  title: string;
  subtitle: string;
  time: string;
  status?: string;
}

export default function MobileDashboard({ className }: DashboardProps) {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Simulate data loading
    const loadData = async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setKpis([
        {
          title: "Revenue",
          value: "$45.2K",
          change: "+12.5%",
          trend: 'up',
          icon: <DollarSign className="h-5 w-5" />
        },
        {
          title: "Active Deals",
          value: "23",
          change: "+3",
          trend: 'up',
          icon: <Target className="h-5 w-5" />
        },
        {
          title: "New Contacts",
          value: "156",
          change: "+8.1%",
          trend: 'up',
          icon: <Users className="h-5 w-5" />
        },
        {
          title: "Response Rate",
          value: "89.3%",
          change: "-2.1%",
          trend: 'down',
          icon: <Activity className="h-5 w-5" />
        }
      ]);

      setRecentActivity([
        {
          id: '1',
          type: 'deal',
          title: 'New deal created',
          subtitle: 'Sarah Johnson - $250K property',
          time: '5m ago',
          status: 'qualified'
        },
        {
          id: '2',
          type: 'email',
          title: 'Email received',
          subtitle: 'Michael Chen replied to proposal',
          time: '12m ago'
        },
        {
          id: '3',
          type: 'meeting',
          title: 'Meeting scheduled',
          subtitle: 'Property viewing with Emma R.',
          time: '1h ago'
        },
        {
          id: '4',
          type: 'contact',
          title: 'Contact added',
          subtitle: 'David Kim - Commercial buyer',
          time: '2h ago'
        }
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deal': return <Target className="h-4 w-4" />;
      case 'email': return <MessageSquare className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'contact': return <Users className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'deal': return 'text-green-500';
      case 'email': return 'text-blue-500';
      case 'meeting': return 'text-purple-500';
      case 'contact': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className={`p-4 space-y-6 ${className}`}>
        {/* Loading skeleton */}
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded animate-pulse" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className={`p-4 space-y-6 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Welcome Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--glass-text)' }}>
          Good morning! 👋
        </h1>
        <p className="text-sm" style={{ color: 'var(--glass-text-muted)' }}>
          Here's what's happening with your business today
        </p>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ scale: shouldReduceMotion ? 1 : 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: shouldReduceMotion ? 0 : 0.3 + index * 0.1,
              type: shouldReduceMotion ? 'tween' : 'spring',
              damping: 20,
              stiffness: 100
            }}
            whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
            className="p-4 rounded-xl"
            style={{
              background: 'var(--glass-surface)',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'var(--glass-primary-muted)' }}
              >
                <div style={{ color: 'var(--glass-primary)' }}>
                  {kpi.icon}
                </div>
              </div>
              <div className={`flex items-center gap-1 text-xs ${
                kpi.trend === 'up' ? 'text-green-500' : 
                kpi.trend === 'down' ? 'text-red-500' : 'text-gray-500'
              }`}>
                {kpi.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : 
                 kpi.trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : null}
                {kpi.change}
              </div>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--glass-text)' }}>
              {kpi.value}
            </div>
            <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
              {kpi.title}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--glass-text)' }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="h-12 justify-start gap-3"
            style={{
              background: 'var(--glass-surface)',
              border: '1px solid var(--glass-border)',
              color: 'var(--glass-text)'
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Add Deal</span>
          </Button>
          <Button
            className="h-12 justify-start gap-3"
            style={{
              background: 'var(--glass-surface)',
              border: '1px solid var(--glass-border)',
              color: 'var(--glass-text)'
            }}
          >
            <Users className="h-4 w-4" />
            <span>Add Contact</span>
          </Button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--glass-text)' }}>
            Recent Activity
          </h2>
          <Button variant="ghost" size="sm" className="text-xs">
            View All
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {recentActivity.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1 + index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: 'var(--glass-surface)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <div 
                className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}
                style={{ backgroundColor: 'var(--glass-surface-subtle)' }}
              >
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: 'var(--glass-text)' }}>
                  {activity.title}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--glass-text-muted)' }}>
                  {activity.subtitle}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                  {activity.time}
                </span>
                {activity.status && (
                  <Badge 
                    className="text-xs"
                    style={{
                      backgroundColor: 'var(--glass-primary-muted)',
                      color: 'var(--glass-primary)'
                    }}
                  >
                    {activity.status}
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Upcoming Tasks */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--glass-text)' }}>
          Urgent Tasks
        </h2>
        <div 
          className="p-4 rounded-xl flex items-center gap-3"
          style={{
            background: 'var(--glass-surface)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <div className="p-2 rounded-lg bg-orange-100">
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>
              Follow up with Sarah Johnson
            </p>
            <p className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
              Property proposal due today
            </p>
          </div>
          <Badge className="bg-orange-100 text-orange-600 text-xs">
            Today
          </Badge>
        </div>
      </motion.div>
    </motion.div>
  );
}