"use client";
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Mail, 
  Calendar,
  Clock,
  Activity
} from 'lucide-react';

interface BackfillStatus {
  emailAccounts: {
    total: number;
    running: number;
    completed: number;
    failed: number;
  };
  calendarAccounts: {
    total: number;
    running: number;
    completed: number;
    failed: number;
  };
  threadsTotal: number;
  eventsTotal: number;
  estimatedTimeRemaining?: number;
}

export default function BackfillProgressCard() {
  const [status, setStatus] = useState<BackfillStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    
    // Poll every 10 seconds during backfill
    const interval = setInterval(() => {
      if (status && (status.emailAccounts.running > 0 || status.calendarAccounts.running > 0)) {
        fetchStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [status]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/sync/backfill-status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch backfill status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const isBackfillActive = status.emailAccounts.running > 0 || status.calendarAccounts.running > 0;
  const emailProgress = status.emailAccounts.total > 0 
    ? ((status.emailAccounts.completed / status.emailAccounts.total) * 100) 
    : 0;
  const calendarProgress = status.calendarAccounts.total > 0 
    ? ((status.calendarAccounts.completed / status.calendarAccounts.total) * 100) 
    : 0;

  if (!isBackfillActive && status.emailAccounts.total === 0 && status.calendarAccounts.total === 0) {
    return null; // No backfill needed
  }

  return (
    <Card className={isBackfillActive ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isBackfillActive ? (
            <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          <span className={isBackfillActive ? 'text-blue-900' : 'text-green-900'}>
            {isBackfillActive ? 'Initial Sync in Progress' : 'Initial Sync Complete'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Backfill */}
        {status.emailAccounts.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">Email Sync</span>
              </div>
              <Badge variant={status.emailAccounts.running > 0 ? 'secondary' : 'default'}>
                {status.emailAccounts.completed}/{status.emailAccounts.total}
              </Badge>
            </div>
            <Progress value={emailProgress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{status.threadsTotal.toLocaleString()} threads synced</span>
              {status.emailAccounts.running > 0 && (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Syncing...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Calendar Backfill */}
        {status.calendarAccounts.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Calendar Sync</span>
              </div>
              <Badge variant={status.calendarAccounts.running > 0 ? 'secondary' : 'default'}>
                {status.calendarAccounts.completed}/{status.calendarAccounts.total}
              </Badge>
            </div>
            <Progress value={calendarProgress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{status.eventsTotal.toLocaleString()} events synced</span>
              {status.calendarAccounts.running > 0 && (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Syncing...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Estimated Time */}
        {isBackfillActive && status.estimatedTimeRemaining && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Clock className="h-3 w-3" />
            <span>
              Estimated time remaining: {Math.ceil(status.estimatedTimeRemaining / 60)} minutes
            </span>
          </div>
        )}

        {/* Error Summary */}
        {(status.emailAccounts.failed > 0 || status.calendarAccounts.failed > 0) && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            <AlertCircle className="h-4 w-4" />
            <span>
              {status.emailAccounts.failed + status.calendarAccounts.failed} account(s) failed sync
            </span>
          </div>
        )}

        {/* Completion Message */}
        {!isBackfillActive && status.emailAccounts.total > 0 && (
          <div className="text-sm text-green-700 bg-green-50 p-3 rounded">
            Your accounts are now synced and ready to use. New emails and events will appear automatically.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
