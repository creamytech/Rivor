"use client";
import { useState, useEffect } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { LiquidProgress } from '@/components/ui/liquid-progress';
import { Button } from '@/components/ui/button';
import { Clock, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompactSyncProgressProps {
  syncType: 'email' | 'calendar' | 'contacts';
  progress: number;
  status: 'running' | 'completed' | 'error' | 'paused';
  eta?: string;
  totalItems?: number;
  processedItems?: number;
  errorCount?: number;
  onViewLogs?: () => void;
  onRetry?: () => void;
  className?: string;
}

export default function CompactSyncProgress({
  syncType,
  progress,
  status,
  eta,
  totalItems,
  processedItems,
  errorCount = 0,
  onViewLogs,
  onRetry,
  className
}: CompactSyncProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'text-blue-600 dark:text-blue-400';
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'paused':
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getSyncTypeLabel = () => {
    switch (syncType) {
      case 'email':
        return 'Email Sync';
      case 'calendar':
        return 'Calendar Sync';
      case 'contacts':
        return 'Contacts Sync';
    }
  };

  const getProgressColor = () => {
    if (status === 'error') return 'red';
    if (status === 'completed') return 'green';
    if (status === 'paused') return 'yellow';
    return 'blue';
  };

  const getProgressVariant = () => {
    if (status === 'running') return 'river';
    if (status === 'completed') return 'wave';
    return 'default';
  };

  return (
    <GlassCard
      variant="river-flow"
      intensity="light"
      flowDirection="right"
      className={cn('transition-all duration-300 hover:shadow-lg', className)}
    >
      <GlassCardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <GlassCardTitle className="text-sm font-medium">
              {getSyncTypeLabel()}
            </GlassCardTitle>
          </div>
          <div className="flex items-center gap-2">
            {eta && status === 'running' && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                {eta}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700"
            >
              <FileText className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Liquid Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {Math.round(progress)}%
            </span>
            <span className={`text-xs font-medium ${getStatusColor()}`}>
              {status === 'running' && 'Syncing...'}
              {status === 'completed' && 'Complete'}
              {status === 'error' && 'Failed'}
              {status === 'paused' && 'Paused'}
            </span>
          </div>
          <LiquidProgress
            value={progress}
            max={100}
            variant={getProgressVariant()}
            color={getProgressColor()}
            animated={status === 'running'}
            className="h-2"
          />
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-white/20 pt-3 space-y-2">
            {totalItems && processedItems && (
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Processed: {processedItems.toLocaleString()}</span>
                <span>Total: {totalItems.toLocaleString()}</span>
              </div>
            )}
            
            {errorCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                {errorCount} errors
              </div>
            )}

            <div className="flex gap-2">
              {onViewLogs && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewLogs}
                  className="text-xs h-7"
                >
                  View Logs
                </Button>
              )}
              {status === 'error' && onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="text-xs h-7"
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
