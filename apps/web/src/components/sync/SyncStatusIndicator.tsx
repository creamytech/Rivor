"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Mail, 
  Calendar,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAutoSync } from '@/hooks/useAutoSync';
import { cn } from '@/lib/utils';

interface SyncStatusIndicatorProps {
  className?: string;
  variant?: 'compact' | 'detailed';
  showControls?: boolean;
}

/**
 * Real-time sync status indicator component
 * Shows current sync state, last sync time, and sync controls
 */
export function SyncStatusIndicator({ 
  className,
  variant = 'compact',
  showControls = true 
}: SyncStatusIndicatorProps) {
  const sync = useAutoSync({
    interval: 10, // 10 minutes
    enabled: true,
    showToasts: false // Don't show toasts from the indicator
  });

  const getStatusIcon = () => {
    if (sync.isRunning) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (!sync.isVisible) {
      return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
    
    if (sync.error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (sync.isHealthy) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (sync.isRunning) {
      return 'Syncing...';
    }
    
    if (!sync.isVisible) {
      return 'Sync paused (tab hidden)';
    }
    
    if (sync.error) {
      return `Sync error: ${sync.error}`;
    }
    
    if (!sync.lastSync) {
      return 'Sync starting...';
    }
    
    const timeSince = sync.timeSinceLastSync;
    if (timeSince && timeSince < 60 * 1000) {
      return 'Just synced';
    } else if (timeSince && timeSince < 60 * 60 * 1000) {
      const minutes = Math.floor(timeSince / (60 * 1000));
      return `Synced ${minutes}m ago`;
    } else if (timeSince) {
      const hours = Math.floor(timeSince / (60 * 60 * 1000));
      return `Synced ${hours}h ago`;
    }
    
    return 'Ready to sync';
  };

  const getStatusColor = () => {
    if (sync.isRunning) return 'blue';
    if (!sync.isVisible) return 'gray';
    if (sync.error) return 'red';
    if (sync.isHealthy) return 'green';
    return 'yellow';
  };

  const formatTimeToNext = () => {
    if (!sync.timeToNextSync || sync.timeToNextSync <= 0) return null;
    
    const minutes = Math.floor(sync.timeToNextSync / (60 * 1000));
    if (minutes < 1) return 'soon';
    if (minutes === 1) return '1m';
    return `${minutes}m`;
  };

  const getTooltipContent = () => {
    const parts = [getStatusText()];
    
    if (sync.lastResult) {
      const { email, calendar } = sync.lastResult;
      
      if (email.synced) {
        if (email.newMessages || email.newThreads) {
          parts.push(`📧 ${email.newMessages || 0} new messages, ${email.newThreads || 0} new threads`);
        } else {
          parts.push('📧 Email up to date');
        }
      } else if (email.error) {
        parts.push(`📧 Email error: ${email.error}`);
      }
      
      if (calendar.synced) {
        if (calendar.newEvents) {
          parts.push(`📅 ${calendar.newEvents} new events`);
        } else {
          parts.push('📅 Calendar up to date');
        }
      } else if (calendar.error) {
        parts.push(`📅 Calendar error: ${calendar.error}`);
      }
    }
    
    const nextSyncTime = formatTimeToNext();
    if (nextSyncTime) {
      parts.push(`Next sync in ${nextSyncTime}`);
    }
    
    return parts.join('\n');
  };

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-2', className)}>
              {getStatusIcon()}
              {showControls && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={sync.triggerSync}
                  disabled={sync.isRunning}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className={cn('h-3 w-3', sync.isRunning && 'animate-spin')} />
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <pre className="text-xs whitespace-pre-wrap">{getTooltipContent()}</pre>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed variant
  return (
    <motion.div 
      className={cn('p-4 rounded-lg border bg-card', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Sync Status</h3>
          <Badge variant={getStatusColor() === 'green' ? 'default' : 'destructive'} className="text-xs">
            {sync.isHealthy ? 'Healthy' : sync.error ? 'Error' : 'Warning'}
          </Badge>
        </div>
        
        {showControls && (
          <Button
            variant="outline"
            size="sm"
            onClick={sync.triggerSync}
            disabled={sync.isRunning}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', sync.isRunning && 'animate-spin')} />
            {sync.isRunning ? 'Syncing...' : 'Sync Now'}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          <span className={cn(
            sync.error && 'text-red-600',
            sync.isHealthy && 'text-green-600'
          )}>
            {getStatusText()}
          </span>
        </div>

        {sync.lastResult && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span>
                {sync.lastResult.email.synced 
                  ? `${sync.lastResult.email.newMessages || 0} new` 
                  : 'Error'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {sync.lastResult.calendar.synced 
                  ? `${sync.lastResult.calendar.newEvents || 0} new` 
                  : 'Error'}
              </span>
            </div>
          </div>
        )}

        {!sync.isVisible && (
          <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
            <WifiOff className="h-3 w-3 inline mr-1" />
            Auto-sync paused while tab is hidden (saves battery)
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {sync.nextSync && formatTimeToNext() && (
            <span>Next automatic sync in {formatTimeToNext()}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}