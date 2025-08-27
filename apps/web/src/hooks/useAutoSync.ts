"use client";

import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { internalFetch } from '@/lib/internal-url';

interface SyncResult {
  email: {
    synced: boolean;
    newMessages?: number;
    newThreads?: number;
    error?: string;
  };
  calendar: {
    synced: boolean;
    newEvents?: number;
    error?: string;
  };
}

interface AutoSyncState {
  isRunning: boolean;
  lastSync: Date | null;
  lastResult: SyncResult | null;
  error: string | null;
  nextSync: Date | null;
}

interface UseAutoSyncOptions {
  interval?: number; // Minutes between syncs (default: 10)
  enabled?: boolean; // Enable/disable auto-sync (default: true)
  showToasts?: boolean; // Show toast notifications for sync results (default: true)
  runOnMount?: boolean; // Run initial sync on mount (default: true)
  onSyncComplete?: (result: SyncResult) => void;
  onSyncError?: (error: string) => void;
}

/**
 * Hook for automatic background synchronization of email and calendar
 * 
 * Features:
 * - Runs incremental sync at specified intervals
 * - Handles network failures and retries
 * - Shows notifications for new content
 * - Pauses when tab is not visible (battery saving)
 * - Provides sync status and controls
 */
export function useAutoSync(options: UseAutoSyncOptions = {}) {
  const {
    interval = 10, // 10 minutes default
    enabled = true,
    showToasts = true,
    runOnMount = true, // Run initial sync by default
    onSyncComplete,
    onSyncError
  } = options;

  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState<AutoSyncState>({
    isRunning: false,
    lastSync: null,
    lastResult: null,
    error: null,
    nextSync: null
  });

  // Track visibility to pause sync when tab is hidden
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Perform sync
  const performSync = async (isManual = false) => {
    if (state.isRunning && !isManual) {
      return; // Prevent concurrent syncs
    }

    setState(prev => ({ ...prev, isRunning: true, error: null }));

    try {
      const response = await internalFetch('/api/sync/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const data = await response.json();
      const result: SyncResult = data.result;

      const nextSyncTime = enabled ? new Date(Date.now() + interval * 60 * 1000) : null;
      console.log(`🕜 Sync completed. Next sync scheduled for: ${nextSyncTime?.toLocaleTimeString() || 'disabled'}`);
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        lastSync: new Date(),
        lastResult: result,
        error: null,
        nextSync: nextSyncTime
      }));

      // Show notifications for new content
      if (showToasts && !isManual) {
        const newMessages = result.email.newMessages || 0;
        const newEvents = result.calendar.newEvents || 0;

        if (newMessages > 0 || newEvents > 0) {
          const parts = [];
          if (newMessages > 0) parts.push(`${newMessages} new email${newMessages !== 1 ? 's' : ''}`);
          if (newEvents > 0) parts.push(`${newEvents} new event${newEvents !== 1 ? 's' : ''}`);

          toast({
            title: "New Content Synced",
            description: parts.join(' and '),
            duration: 5000,
          });
        }
      }

      // Call success callback
      onSyncComplete?.(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: errorMessage,
        nextSync: enabled ? new Date(Date.now() + Math.min(interval * 60 * 1000, 5 * 60 * 1000)) : null // Retry sooner on error
      }));

      // Show error notification only for manual sync or critical errors
      if (showToasts && (isManual || !errorMessage.includes('401'))) {
        toast({
          title: "Sync Error",
          description: errorMessage,
          variant: "destructive",
          duration: 3000,
        });
      }

      // Call error callback
      onSyncError?.(errorMessage);
    }
  };

  // Manual sync trigger
  const triggerSync = () => {
    performSync(true);
  };

  // Setup automatic sync interval
  useEffect(() => {
    if (!enabled || !isVisible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Perform initial sync after a short delay (if enabled)
    let initialDelay: NodeJS.Timeout | null = null;
    if (runOnMount) {
      initialDelay = setTimeout(() => {
        performSync();
      }, 2000); // 2 second delay to let the page load
    }

    // Setup recurring sync
    console.log(`🕑 Setting up auto-sync interval: ${interval} minutes (${interval * 60 * 1000}ms)`);
    intervalRef.current = setInterval(() => {
      console.log(`🔄 Auto-sync interval triggered! isVisible: ${isVisible}`);
      if (isVisible) { // Only sync when tab is visible
        console.log('✅ Tab is visible, starting auto-sync...');
        performSync();
      } else {
        console.log('🚷 Tab not visible, skipping auto-sync');
      }
    }, interval * 60 * 1000);

    return () => {
      if (initialDelay) clearTimeout(initialDelay);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, isVisible, runOnMount]);

  // Update next sync time when interval changes
  useEffect(() => {
    if (enabled && state.lastSync) {
      setState(prev => ({
        ...prev,
        nextSync: new Date(state.lastSync!.getTime() + interval * 60 * 1000)
      }));
    }
  }, [interval, enabled, state.lastSync]);

  return {
    ...state,
    triggerSync,
    isEnabled: enabled,
    intervalMinutes: interval,
    isVisible,
    // Helper computed properties
    timeSinceLastSync: state.lastSync ? Date.now() - state.lastSync.getTime() : null,
    timeToNextSync: state.nextSync ? state.nextSync.getTime() - Date.now() : null,
    hasNewContent: state.lastResult ? 
      (state.lastResult.email.newMessages || 0) + (state.lastResult.calendar.newEvents || 0) > 0 : false,
    isHealthy: !state.error && state.lastSync && (Date.now() - state.lastSync.getTime()) < 30 * 60 * 1000 // Healthy if synced within 30 minutes
  };
}