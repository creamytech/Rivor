"use client";
import { useState, useEffect } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle, Users, MessageSquare, Calendar, Shield } from 'lucide-react';

interface TodayAtAGlanceProps {
  leadsData?: {
    new: number;
    total: number;
    trend: 'up' | 'down' | 'stable';
  };
  repliesData?: {
    due: number;
    overdue: number;
  };
  meetingsData?: {
    today: number;
    upcoming: number;
  };
  tokenHealthData?: {
    status: 'healthy' | 'warning' | 'error';
    lastSync: string;
    errors: number;
  };
}

export default function TodayAtAGlance({
  leadsData = { new: 12, total: 156, trend: 'up' },
  repliesData = { due: 8, overdue: 2 },
  meetingsData = { today: 3, upcoming: 7 },
  tokenHealthData = { status: 'healthy', lastSync: '2 hours ago', errors: 0 }
}: TodayAtAGlanceProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const getTokenHealthIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getTokenHealthColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <GlassCard key={i} variant="gradient" intensity="light" className="animate-pulse">
            <GlassCardContent className="p-4">
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-8 bg-white/20 rounded"></div>
            </GlassCardContent>
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Leads Card */}
      <GlassCard 
        variant="gradient" 
        intensity="medium" 
        className="group hover:scale-105 transition-transform duration-300 cursor-pointer"
      >
        <GlassCardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-blue-500" />
            {getTrendIcon(leadsData.trend)}
          </div>
          <GlassCardTitle className="text-2xl font-bold mb-1">
            {leadsData.new}
          </GlassCardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            New leads today
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {leadsData.total} total active
          </p>
        </GlassCardContent>
      </GlassCard>

      {/* Replies Due Card */}
      <GlassCard 
        variant="gradient" 
        intensity="medium" 
        className="group hover:scale-105 transition-transform duration-300 cursor-pointer"
      >
        <GlassCardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="h-5 w-5 text-purple-500" />
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <GlassCardTitle className="text-2xl font-bold mb-1">
            {repliesData.due}
          </GlassCardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Replies due today
          </p>
          {repliesData.overdue > 0 && (
            <p className="text-xs text-red-500 mt-1">
              {repliesData.overdue} overdue
            </p>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Meetings Today Card */}
      <GlassCard 
        variant="gradient" 
        intensity="medium" 
        className="group hover:scale-105 transition-transform duration-300 cursor-pointer"
      >
        <GlassCardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-5 w-5 text-teal-500" />
            <div className="text-xs bg-teal-500/20 text-teal-600 dark:text-teal-400 px-2 py-1 rounded-full">
              {meetingsData.upcoming} upcoming
            </div>
          </div>
          <GlassCardTitle className="text-2xl font-bold mb-1">
            {meetingsData.today}
          </GlassCardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Meetings today
          </p>
        </GlassCardContent>
      </GlassCard>

      {/* Token Health Card */}
      <GlassCard 
        variant="gradient" 
        intensity="medium" 
        className="group hover:scale-105 transition-transform duration-300 cursor-pointer"
      >
        <GlassCardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Shield className="h-5 w-5 text-indigo-500" />
            {getTokenHealthIcon(tokenHealthData.status)}
          </div>
          <GlassCardTitle className={`text-2xl font-bold mb-1 ${getTokenHealthColor(tokenHealthData.status)}`}>
            {tokenHealthData.errors}
          </GlassCardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Token health
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Last sync: {tokenHealthData.lastSync}
          </p>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
