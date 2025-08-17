"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, CheckCircle, AlertCircle, RefreshCw, Unlink, XCircle, Activity, Clock, Shield, Key } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";

interface EmailAccount {
  id: string;
  provider: string;
  email: string;
  displayName?: string;
  status: 'connected' | 'action_needed' | 'disconnected';
  syncStatus: 'idle' | 'scheduled' | 'running' | 'error';
  lastSyncedAt?: string;
  encryptionStatus: 'ok' | 'pending' | 'failed';
  errorReason?: string;
  kmsErrorCode?: string;
  kmsErrorAt?: string;
  uiStatus: string;
  requiresRetry: boolean;
  canReconnect: boolean;
}

interface IntegrationStatus {
  overallStatus: string;
  summary: {
    totalAccounts: number;
    connectedAccounts: number;
    actionNeededAccounts: number;
    disconnectedAccounts: number;
  };
  emailAccounts: EmailAccount[];
  tokenEncryption: {
    totalTokens: number;
    okTokens: number;
    pendingTokens: number;
    failedTokens: number;
    oldestFailure?: string;
  };
  lastUpdated: string;
}

interface IntegrationStatusPanelProps {
  onDisconnect?: (provider: string) => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

export default function IntegrationStatusPanel({ 
  onDisconnect 
}: IntegrationStatusPanelProps) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState<string | null>(null);
  const [runningHealthCheck, setRunningHealthCheck] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  // Load integration status
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/integrations/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        console.error('Failed to fetch integration status');
      }
    } catch (error) {
      console.error('Error fetching integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async (provider: string) => {
    setReconnecting(provider);
    try {
      await signIn(provider, { callbackUrl: "/app" });
    } catch (error) {
      console.error("Reconnect failed:", error);
      setReconnecting(null);
    }
  };

  const handleHealthCheck = async (provider: string) => {
    setRunningHealthCheck(provider);
    try {
      const response = await fetch('/api/integrations/status?probe=true');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        console.error('Health check failed');
      }
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setRunningHealthCheck(null);
    }
  };

  const handleRetryEncryption = async (emailAccountId: string) => {
    setRetrying(emailAccountId);
    try {
      // In a real implementation, you'd need to handle OAuth re-flow
      // For now, we'll just trigger a reconnection
      const account = status?.emailAccounts.find(acc => acc.id === emailAccountId);
      if (account) {
        await handleReconnect(account.provider);
      }
    } catch (error) {
      console.error("Retry failed:", error);
    } finally {
      setRetrying(null);
    }
  };

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'google': return 'Google';
      case 'azure-ad': return 'Microsoft';
      default: return provider;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'azure-ad':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
          </svg>
        );
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (account: EmailAccount) => {
    switch (account.uiStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'encryption_failed':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'missing_tokens':
        return <Key className="h-4 w-4 text-orange-500" />;
      case 'probe_failed':
      case 'insufficient_scopes':
      case 'action_needed':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (account: EmailAccount) => {
    switch (account.uiStatus) {
      case 'connected':
        return "Connected";
      case 'encryption_failed':
        return "Encryption Failed";
      case 'missing_tokens':
        return "Missing Tokens";
      case 'probe_failed':
        return "Health Check Failed";
      case 'insufficient_scopes':
        return "Insufficient Permissions";
      case 'action_needed':
        return "Action Needed";
      case 'disconnected':
        return "Disconnected";
      default:
        return "Unknown Status";
    }
  };

  const getStatusVariant = (account: EmailAccount): "default" | "secondary" | "destructive" => {
    switch (account.uiStatus) {
      case 'connected':
        return "default";
      case 'encryption_failed':
      case 'disconnected':
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Integrations</CardTitle>
          </div>
          <CardDescription>Loading integration status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Integrations</CardTitle>
            {status?.summary?.totalAccounts > 0 && (
              <Badge variant={status?.overallStatus === 'all_connected' ? 'default' : 'secondary'}>
                {status.summary.connectedAccounts}/{status.summary.totalAccounts}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/settings" className="flex items-center gap-1">
              Manage
            </Link>
          </Button>
        </div>
        <CardDescription>
          Email and calendar connections
          {status?.tokenEncryption && status.tokenEncryption.failedTokens > 0 && (
            <span className="ml-2 text-red-600">
              • {status.tokenEncryption.failedTokens} token encryption failed
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {status?.emailAccounts.map((account) => (
            <div 
              key={account.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex-shrink-0">
                {getProviderIcon(account.provider)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {getProviderDisplayName(account.provider)}
                  </span>
                  {getStatusIcon(account)}
                </div>
                
                <div className="text-xs text-gray-600 truncate">
                  {account.displayName || account.email}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={getStatusVariant(account)}
                    className="text-xs"
                  >
                    {getStatusText(account)}
                  </Badge>
                  
                  {/* Sync Status */}
                  {account.syncStatus !== 'idle' && (
                    <Badge variant="outline" className="text-xs">
                      {account.syncStatus === 'running' ? (
                        <>
                          <Activity className="h-3 w-3 mr-1 animate-pulse" />
                          Syncing
                        </>
                      ) : (
                        account.syncStatus
                      )}
                    </Badge>
                  )}
                  
                  {account.lastSyncedAt && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last sync: {formatRelativeTime(new Date(account.lastSyncedAt))}
                    </span>
                  )}
                </div>
                
                {/* Encryption Status */}
                {account.encryptionStatus !== 'ok' && (
                  <div className="flex items-center gap-1 mt-1 text-xs">
                    <Shield className="h-3 w-3 text-orange-500" />
                    <span className="text-orange-600">
                      Encryption {account.encryptionStatus}
                      {account.kmsErrorCode && ` (${account.kmsErrorCode})`}
                    </span>
                  </div>
                )}
                
                {/* Error Display */}
                {account.errorReason && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                    {account.errorReason}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {/* Health Check Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleHealthCheck(account.provider)}
                  disabled={runningHealthCheck === account.provider}
                  title="Run health check now"
                >
                  {runningHealthCheck === account.provider ? (
                    <>
                      <Activity className="h-3 w-3 mr-1 animate-pulse" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Activity className="h-3 w-3 mr-1" />
                      Check
                    </>
                  )}
                </Button>
                
                {/* Retry Encryption Button */}
                {account.requiresRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetryEncryption(account.id)}
                    disabled={retrying === account.id}
                    title="Retry token encryption"
                  >
                    {retrying === account.id ? (
                      <>
                        <Key className="h-3 w-3 mr-1 animate-pulse" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <Key className="h-3 w-3 mr-1" />
                        Retry
                      </>
                    )}
                  </Button>
                )}
                
                {/* Reconnect Button */}
                {account.canReconnect && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReconnect(account.provider)}
                    disabled={reconnecting === account.provider}
                  >
                    {reconnecting === account.provider ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Reconnect
                      </>
                    )}
                  </Button>
                )}
                
                {/* Disconnect Button */}
                {account.status === 'connected' && onDisconnect && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDisconnect(account.provider)}
                  >
                    <Unlink className="h-3 w-3 mr-1" />
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {(!status || status?.emailAccounts?.length === 0) && (
            <div className="text-center py-4 text-sm text-gray-500">
              No integrations connected yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
