"use client";
import { useState, useEffect } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle, Users, MessageSquare, Calendar, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadsData {
  new: number;
  total: number;
  trend: string;
}

interface RepliesData {
  due: number;
  trend: string;
}

interface MeetingsData {
  today: number;
  trend: string;
}

interface TokenHealthData {
  healthy: number;
  total: number;
  status: string;
}

interface TodayAtAGlanceProps {
  leadsData?: LeadsData;
  repliesData?: RepliesData;
  meetingsData?: MeetingsData;
  tokenHealthData?: TokenHealthData;
  className?: string;
}

export default function TodayAtAGlance({
  leadsData,
  repliesData,
  meetingsData,
  tokenHealthData,
  className
}: TodayAtAGlanceProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-slate-400" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-slate-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full", className)}>
      {/* Leads Card */}
      <GlassCard
        variant="river-flow"
        intensity="medium"
        flowDirection="right"
        className="group hover:scale-105 transition-transform duration-300 cursor-pointer h-full flex flex-col"
      >
        <GlassCardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-blue-500" />
            {leadsData && getTrendIcon(leadsData.trend)}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <GlassCardTitle className="text-2xl font-bold mb-1">
              {leadsData?.new || 0}
            </GlassCardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              New leads today
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {leadsData?.total || 0} total active
            </p>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Replies Card */}
      <GlassCard
        variant="river-flow"
        intensity="medium"
        flowDirection="down"
        className="group hover:scale-105 transition-transform duration-300 cursor-pointer h-full flex flex-col"
      >
        <GlassCardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            {repliesData && getTrendIcon(repliesData.trend)}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <GlassCardTitle className="text-2xl font-bold mb-1">
              {repliesData?.due || 0}
            </GlassCardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Replies due today
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {repliesData?.due || 0} pending
            </p>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Meetings Card */}
      <GlassCard
        variant="river-flow"
        intensity="medium"
        flowDirection="left"
        className="group hover:scale-105 transition-transform duration-300 cursor-pointer h-full flex flex-col"
      >
        <GlassCardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            {meetingsData && getTrendIcon(meetingsData.trend)}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <GlassCardTitle className="text-2xl font-bold mb-1">
              {meetingsData?.today || 0}
            </GlassCardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Meetings today
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {meetingsData?.today || 0} scheduled
            </p>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Token Health Card */}
      <GlassCard
        variant="river-flow"
        intensity="medium"
        flowDirection="up"
        className="group hover:scale-105 transition-transform duration-300 cursor-pointer h-full flex flex-col"
      >
        <GlassCardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <Shield className="h-5 w-5 text-teal-500" />
            {tokenHealthData && getStatusIcon(tokenHealthData.status)}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <GlassCardTitle className="text-2xl font-bold mb-1">
              {tokenHealthData?.healthy || 0}/{tokenHealthData?.total || 0}
            </GlassCardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Token health
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {tokenHealthData?.status || 'unknown'} status
            </p>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
