"use client";
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Shield, 
  Mail, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Users,
  Activity,
  Server
} from 'lucide-react';

interface HealthData {
  status: 'healthy' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  schemaVersion?: string;
  database: {
    status: string;
    error?: string;
    url_host: string;
  };
  encryption: {
    kms_enabled: boolean;
    kms_provider?: string;
    token_health: {
      total_tokens: number;
      ok_tokens: number;
      pending_tokens: number;
      failed_tokens: number;
      oldest_failure?: string;
    };
  };
  accounts: {
    total: number;
    by_sync_status: Record<string, number>;
    by_connection_status: Record<string, number>;
    by_encryption_status: Record<string, number>;
  };
  pubsub: {
    configured: boolean;
    topic?: string;
    verification_token_set: boolean;
    last_push_received?: string;
  };
  recent_errors: Array<{
    action: string;
    resource?: string;
    createdAt: string;
    orgId: string;
  }>;
  response_time_ms: number;
}

export default function AdminHealthDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setError(null);
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      } else {
        setError(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err: unknown) {
      setError(err.message || 'Failed to fetch health data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHealth();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
      case 'connected':
        return 'text-green-500';
      case 'degraded':
      case 'pending':
      case 'action_needed':
        return 'text-yellow-500';
      case 'error':
      case 'failed':
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-900">Health Check Failed</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <Button 
                onClick={handleRefresh} 
                className="mt-3" 
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) return null;

  return (
    <div className="space-y-6">
      {/* Header Status */}
      <Card className={`border-l-4 ${
        health.status === 'healthy' ? 'border-l-green-500 bg-green-50' :
        health.status === 'degraded' ? 'border-l-yellow-500 bg-yellow-50' :
        'border-l-red-500 bg-red-50'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${
                health.status === 'healthy' ? 'bg-green-500' :
                health.status === 'degraded' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              <CardTitle className="text-xl">
                System Status: {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
              </CardTitle>
            </div>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            Uptime: {formatUptime(health.uptime)} • 
            Last updated: {formatRelativeTime(health.timestamp)} • 
            Response: {health.response_time_ms}ms
          </div>
        </CardHeader>
      </Card>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Database */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge variant={health.database.status === 'ok' ? 'default' : 'destructive'}>
                  {health.database.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Host</span>
                <span className="text-sm font-mono">{health.database.url_host}</span>
              </div>
              {health.schemaVersion && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Schema</span>
                  <span className="text-sm font-mono">{health.schemaVersion}</span>
                </div>
              )}
              {health.database.error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {health.database.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KMS & Encryption */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Encryption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">KMS</span>
                <Badge variant={health.encryption.kms_enabled ? 'default' : 'secondary'}>
                  {health.encryption.kms_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              {health.encryption.kms_provider && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Provider</span>
                  <span className="text-sm">{health.encryption.kms_provider.toUpperCase()}</span>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tokens OK</span>
                  <span className="text-sm font-semibold text-green-600">
                    {health.encryption.token_health.ok_tokens}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Failed</span>
                  <span className={`text-sm font-semibold ${
                    health.encryption.token_health.failed_tokens > 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {health.encryption.token_health.failed_tokens}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending</span>
                  <span className="text-sm text-yellow-600">
                    {health.encryption.token_health.pending_tokens}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total</span>
                <span className="text-sm font-semibold">{health.accounts.total}</span>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-500 uppercase">Connection Status</div>
                {Object.entries(health.accounts.by_connection_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                    <span className={`text-sm font-semibold ${getStatusColor(status)}`}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-500 uppercase">Sync Status</div>
                {Object.entries(health.accounts.by_sync_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{status}</span>
                    <span className={`text-sm font-semibold ${getStatusColor(status)}`}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pub/Sub Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pub/Sub</span>
                <Badge variant={health.pubsub.configured ? 'default' : 'secondary'}>
                  {health.pubsub.configured ? 'Configured' : 'Not Set'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Verification</span>
                <Badge variant={health.pubsub.verification_token_set ? 'default' : 'destructive'}>
                  {health.pubsub.verification_token_set ? 'Set' : 'Missing'}
                </Badge>
              </div>
              {health.pubsub.topic && (
                <div className="text-xs text-gray-600 break-all">
                  Topic: {health.pubsub.topic}
                </div>
              )}
              {health.pubsub.last_push_received && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs text-gray-600">
                    Last push: {formatRelativeTime(health.pubsub.last_push_received)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Errors ({health.recent_errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {health.recent_errors.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">No recent errors</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {health.recent_errors.map((error, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 bg-red-50 rounded text-sm">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-red-900">{error.action}</div>
                      {error.resource && (
                        <div className="text-red-700 truncate">{error.resource}</div>
                      )}
                      <div className="text-red-600 text-xs">
                        {formatRelativeTime(error.createdAt)} • Org: {error.orgId.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
