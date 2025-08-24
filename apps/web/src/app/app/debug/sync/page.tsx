"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppShell from '@/components/app/AppShell';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Database, 
  Mail, 
  Calendar,
  Key,
  Webhook,
  Play,
  RotateCcw,
  Trash2,
  Plus,
  Settings
} from 'lucide-react';
import { useToast } from '@/components/river/RiverToast';

interface DebugInfo {
  status: string;
  timestamp: string;
  user: {
    email: string;
    orgId: string;
  };
  auth: {
    tokenCount: number;
    tokens: Array<{
      provider: string;
      connected: boolean;
      expired: boolean;
      scopes: string[];
      error?: string;
    }>;
    hasGmailScopes: boolean;
    hasCalendarScopes: boolean;
    validTokens: number;
  };
  database: {
    emailAccounts: Array<{
      id: string;
      email: string;
      provider: string;
      status: string;
      syncStatus: string;
      encryptionStatus: string;
      lastSyncedAt: string | null;
      threadCount: number;
      hasTokenRef: boolean;
      externalAccountId: string | null;
    }>;
    calendarAccounts: Array<{
      id: string;
      provider: string;
      status: string;
      lastSyncedAt: string | null;
      eventCount: number;
    }>;
  };
  googleApi: {
    clientIdSet: boolean;
    clientSecretSet: boolean;
    pubsubConfigured: boolean;
    scopesConfigured: string;
  };
  sync: {
    recentSyncLogs: Array<{
      action: string;
      success: boolean;
      createdAt: string;
      resource: string;
    }>;
    recentPushNotifications: number;
    lastPushReceived: string | null;
  };
  errors: string[];
  responseTimeMs: number;
}

export default function SyncDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDebugInfo = async (testSync = false) => {
    setLoading(true);
    try {
      const url = `/api/debug/sync-status${testSync ? '?testSync=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch debug info",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (action: string) => {
    setActionLoading(action);
    try {
      const response = await fetch('/api/debug/sync-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Action ${action} completed successfully`,
        });
        fetchDebugInfo();
      } else {
        toast({
          title: "Action Failed",
          description: result.error || `Failed to ${action}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to perform ${action}`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const performAccountAction = async (action: 'cleanup' | 'setup' | 'setup_database') => {
    setActionLoading(action);
    try {
      let endpoint: string;
      let actionName: string;
      
      switch (action) {
        case 'cleanup':
          endpoint = '/api/debug/cleanup-accounts';
          actionName = 'Cleanup';
          break;
        case 'setup':
          endpoint = '/api/debug/setup-accounts';
          actionName = 'Setup';
          break;
        case 'setup_database':
          endpoint = '/api/debug/setup-database';
          actionName = 'Database Setup';
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: `${actionName} completed successfully`,
        });
        fetchDebugInfo();
      } else {
        toast({
          title: `${actionName} Failed`,
          description: result.error || `Failed to ${action}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action}`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ISSUES_FOUND': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'connected' || status === 'ok') return 'bg-green-500';
    if (status === 'action_needed' || status === 'error') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Sync Debug Dashboard
          </h1>
          <div className="flex gap-2">
            <Button onClick={() => fetchDebugInfo()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => fetchDebugInfo(true)} disabled={loading} variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Test Sync
            </Button>
          </div>
        </div>

        {debugInfo && (
          <div className="space-y-6">
            {/* Overall Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(debugInfo.status)}
                  System Status: {debugInfo.status}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">User</p>
                    <p className="font-mono text-sm">{debugInfo.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Org ID</p>
                    <p className="font-mono text-sm">{debugInfo.user.orgId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Response Time</p>
                    <p className="font-mono text-sm">{debugInfo.responseTimeMs}ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Timestamp</p>
                    <p className="font-mono text-sm">{new Date(debugInfo.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                
                {debugInfo.errors && debugInfo.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-red-600 mb-2">Errors Found:</h4>
                    <ul className="space-y-1">
                      {(debugInfo.errors || []).map((error, i) => (
                        <li key={i} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Authentication Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Authentication & Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Tokens</p>
                    <p className="text-2xl font-bold">{debugInfo.auth?.tokenCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Valid Tokens</p>
                    <p className="text-2xl font-bold">{debugInfo.auth?.validTokens || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gmail Access</p>
                    <Badge variant={debugInfo.auth?.hasGmailScopes ? 'default' : 'destructive'}>
                      {debugInfo.auth?.hasGmailScopes ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Calendar Access</p>
                    <Badge variant={debugInfo.auth?.hasCalendarScopes ? 'default' : 'destructive'}>
                      {debugInfo.auth?.hasCalendarScopes ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>

                {debugInfo.auth?.tokens && debugInfo.auth.tokens.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Token Details:</h4>
                    <div className="space-y-2">
                      {(debugInfo.auth?.tokens || []).map((token, i) => (
                        <div key={i} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                          <Badge variant="outline">{token.provider}</Badge>
                          <Badge variant={token.connected && !token.expired ? 'default' : 'destructive'}>
                            {token.connected && !token.expired ? 'Valid' : 'Invalid'}
                          </Badge>
                          <span className="text-sm">{token.scopes?.length || 0} scopes</span>
                          {token.error && <span className="text-sm text-red-600">{token.error}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Database Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Accounts ({debugInfo.database?.emailAccounts?.length || 0})
                    </h4>
                    {(debugInfo.database?.emailAccounts || []).map((account, i) => (
                      <div key={i} className="p-3 border rounded mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm">{account.email}</span>
                          <div className="flex gap-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(account.status)}`} title={`Status: ${account.status}`} />
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(account.syncStatus)}`} title={`Sync: ${account.syncStatus}`} />
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(account.encryptionStatus)}`} title={`Encryption: ${account.encryptionStatus}`} />
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                          <span>Threads: {account.threadCount}</span>
                          <span>Token: {account.hasTokenRef ? 'Yes' : 'No'}</span>
                          <span>Last Sync: {account.lastSyncedAt ? new Date(account.lastSyncedAt).toLocaleString() : 'Never'}</span>
                          <span>External ID: {account.externalAccountId ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Calendar Accounts ({debugInfo.database?.calendarAccounts?.length || 0})
                    </h4>
                    {(debugInfo.database?.calendarAccounts || []).map((account, i) => (
                      <div key={i} className="p-3 border rounded mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm">{account.provider}</span>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(account.status)}`} title={`Status: ${account.status}`} />
                        </div>
                        <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                          <span>Events: {account.eventCount}</span>
                          <span>Last Sync: {account.lastSyncedAt ? new Date(account.lastSyncedAt).toLocaleString() : 'Never'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Google API Config */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Google API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Client ID</p>
                    <Badge variant={debugInfo.googleApi?.clientIdSet ? 'default' : 'destructive'}>
                      {debugInfo.googleApi?.clientIdSet ? 'Set' : 'Missing'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Client Secret</p>
                    <Badge variant={debugInfo.googleApi?.clientSecretSet ? 'default' : 'destructive'}>
                      {debugInfo.googleApi?.clientSecretSet ? 'Set' : 'Missing'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pub/Sub</p>
                    <Badge variant={debugInfo.googleApi?.pubsubConfigured ? 'default' : 'destructive'}>
                      {debugInfo.googleApi?.pubsubConfigured ? 'Configured' : 'Missing'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Scopes</p>
                    <p className="text-xs font-mono">{debugInfo.googleApi?.scopesConfigured || 'Not set'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sync Status */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sync Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Recent Sync Logs</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {(debugInfo.sync?.recentSyncLogs || []).map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <span className="flex items-center gap-2">
                            {log.success ? 
                              <CheckCircle className="h-3 w-3 text-green-500" /> : 
                              <XCircle className="h-3 w-3 text-red-500" />
                            }
                            {log.action}
                          </span>
                          <span className="text-xs text-gray-600">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Push Notifications</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Recent Push Count (24h)</p>
                        <p className="text-2xl font-bold">{debugInfo.sync?.recentPushNotifications || 0}</p>
                      </div>
                      {debugInfo.sync?.lastPushReceived && (
                        <div>
                          <p className="text-sm text-gray-600">Last Push Received</p>
                          <p className="text-sm">{new Date(debugInfo.sync.lastPushReceived).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Setup */}
            <Card>
              <CardHeader>
                <CardTitle>Database Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    onClick={() => performAccountAction('setup_database')}
                    disabled={!!actionLoading}
                    variant="default"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {actionLoading === 'setup_database' ? 'Setting up...' : 'Setup Database'}
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Creates default organization for KMS encryption and verifies database schema.
                </p>
              </CardContent>
            </Card>

            {/* Account Management */}
            <Card>
              <CardHeader>
                <CardTitle>Account Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    onClick={() => performAccountAction('cleanup')} 
                    disabled={!!actionLoading}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {actionLoading === 'cleanup' ? 'Cleaning up...' : 'Cleanup Accounts'}
                  </Button>
                  <Button 
                    onClick={() => performAccountAction('setup')} 
                    disabled={!!actionLoading}
                    variant="default"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {actionLoading === 'setup' ? 'Setting up...' : 'Setup Accounts'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setActionLoading('debug_tokens');
                      fetch('/api/debug/check-tokens')
                        .then(response => response.json())
                        .then(data => {
                          console.log('Token Debug:', data);
                          alert(JSON.stringify(data, null, 2));
                          setActionLoading(null);
                        })
                        .catch(error => {
                          console.error('Debug error:', error);
                          alert('Debug failed: ' + error.message);
                          setActionLoading(null);
                        });
                    }}
                    disabled={!!actionLoading}
                    variant="outline"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {actionLoading === 'debug_tokens' ? 'Debugging...' : 'Debug Tokens'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setActionLoading('debug_orgs');
                      fetch('/api/debug/check-orgs')
                        .then(response => response.json())
                        .then(data => {
                          console.log('Org Debug:', data);
                          alert(JSON.stringify(data, null, 2));
                          setActionLoading(null);
                        })
                        .catch(error => {
                          console.error('Org debug error:', error);
                          alert('Org debug failed: ' + error.message);
                          setActionLoading(null);
                        });
                    }}
                    disabled={!!actionLoading}
                    variant="outline"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    {actionLoading === 'debug_orgs' ? 'Checking...' : 'Check Orgs'}
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Use cleanup first to remove broken accounts, then setup to create fresh accounts with proper token links.
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Debug Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={() => performAction('force_gmail_sync')} 
                    disabled={!!actionLoading}
                    variant="outline"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {actionLoading === 'force_gmail_sync' ? 'Syncing...' : 'Force Gmail Sync'}
                  </Button>
                  <Button 
                    onClick={() => performAction('force_calendar_sync')} 
                    disabled={!!actionLoading}
                    variant="outline"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {actionLoading === 'force_calendar_sync' ? 'Syncing...' : 'Force Calendar Sync'}
                  </Button>
                  <Button 
                    onClick={() => performAction('reset_sync_status')} 
                    disabled={!!actionLoading}
                    variant="outline"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {actionLoading === 'reset_sync_status' ? 'Resetting...' : 'Reset Sync Status'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {loading && !debugInfo && (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        )}
      </div>
    </AppShell>
  );
}