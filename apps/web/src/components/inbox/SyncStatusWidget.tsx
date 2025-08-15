"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  Inbox, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Mail,
  Activity
} from "lucide-react";
import { useState, useEffect } from "react";

interface SyncStatus {
  accountsTotal: number;
  accountsConnected: number;
  accountsBackfilling: number;
  accountsError: number;
  threadsTotal: number;
  lastSyncAt?: string;
  syncInProgress: boolean;
}

export default function SyncStatusWidget() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSyncStatus();
    
    // Refresh status every 30 seconds if sync is in progress
    const interval = setInterval(() => {
      if (status?.syncInProgress) {
        fetchSyncStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [status?.syncInProgress]);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSyncStatus();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  const getStatusIcon = () => {
    if (status.accountsError > 0) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (status.accountsBackfilling > 0) {
      return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
    }
    if (status.accountsConnected > 0) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (status.accountsError > 0) {
      return `${status.accountsError} account${status.accountsError !== 1 ? 's' : ''} need attention`;
    }
    if (status.accountsBackfilling > 0) {
      return `Syncing emails (${status.accountsBackfilling} account${status.accountsBackfilling !== 1 ? 's' : ''})`;
    }
    if (status.accountsConnected > 0) {
      return `${status.accountsConnected} account${status.accountsConnected !== 1 ? 's' : ''} connected`;
    }
    return 'No accounts connected';
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" => {
    if (status.accountsError > 0) return "destructive";
    if (status.accountsBackfilling > 0) return "secondary";
    if (status.accountsConnected > 0) return "default";
    return "secondary";
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sync Status</span>
                <Badge variant={getStatusVariant()} className="text-xs">
                  {getStatusText()}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                {status.threadsTotal > 0 && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>{status.threadsTotal.toLocaleString()} threads</span>
                  </div>
                )}
                
                {status.lastSyncAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      Last sync: {new Date(status.lastSyncAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Show backfill progress if applicable */}
        {status.accountsBackfilling > 0 && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <Activity className="h-4 w-4 animate-pulse" />
              <span>
                Initial email backfill in progress. This can take a few minutes.
              </span>
            </div>
            <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
              Your inbox will populate as emails are synced from your email provider.
            </div>
          </div>
        )}
        
        {/* Show error message if applicable */}
        {status.accountsError > 0 && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              <span>
                Some accounts need attention. Check your integration settings.
              </span>
            </div>
          </div>
        )}
        
        {/* Show empty state if no accounts */}
        {status.accountsTotal === 0 && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Inbox className="h-4 w-4" />
              <span>
                Connect an email account to start syncing your inbox.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
