"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, CheckCircle, AlertCircle, RefreshCw, Unlink, XCircle, Activity, Clock } from "lucide-react";
import Link from "next/link";
import { TokenHealth } from "@/server/oauth";
import { signIn } from "next-auth/react";
import { useState } from "react";

interface IntegrationStatusPanelProps {
  tokenHealth: TokenHealth[];
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
  tokenHealth,
  onDisconnect 
}: IntegrationStatusPanelProps) {
  const [reconnecting, setReconnecting] = useState<string | null>(null);
  const [runningHealthCheck, setRunningHealthCheck] = useState<string | null>(null);

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
      const response = await fetch('/api/integrations/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      
      if (response.ok) {
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        console.error('Health check failed');
      }
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setRunningHealthCheck(null);
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

  const getStatusIcon = (token: TokenHealth) => {
    // Check for token validation errors first
    if (token.tokenValidation?.needsRefresh || token.expired) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    // Check service health
    const hasHealthyService = token.services?.gmail?.success || token.services?.calendar?.success;
    const hasFailedService = (token.services?.gmail && !token.services.gmail.success) || 
                            (token.services?.calendar && !token.services.calendar.success);
    
    if (token.connected && hasHealthyService) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (hasFailedService || !token.connected) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    
    return <AlertCircle className="h-4 w-4 text-gray-500" />;
  };

  const getStatusText = (token: TokenHealth) => {
    if (token.tokenValidation?.needsRefresh || token.expired) {
      return "Needs Reconnection";
    }
    
    const hasHealthyService = token.services?.gmail?.success || token.services?.calendar?.success;
    
    if (token.connected && hasHealthyService) {
      return "Connected";
    }
    
    if (token.connected && !hasHealthyService) {
      return "Connected (No Recent Activity)";
    }
    
    return "Disconnected";
  };

  const getStatusVariant = (token: TokenHealth): "default" | "secondary" | "destructive" => {
    if (token.tokenValidation?.needsRefresh || token.expired) return "destructive";
    
    const hasHealthyService = token.services?.gmail?.success || token.services?.calendar?.success;
    if (token.connected && hasHealthyService) return "default";
    
    return "secondary";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Integrations</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/settings" className="flex items-center gap-1">
              Manage
            </Link>
          </Button>
        </div>
        <CardDescription>
          Email and calendar connections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tokenHealth.map((token) => (
            <div 
              key={token.provider}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex-shrink-0">
                {getProviderIcon(token.provider)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {getProviderDisplayName(token.provider)}
                  </span>
                  {getStatusIcon(token)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={getStatusVariant(token)}
                    className="text-xs"
                  >
                    {getStatusText(token)}
                  </Badge>
                  {token.lastProbeSuccess && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last checked: {formatRelativeTime(token.lastProbeSuccess)}
                    </span>
                  )}
                </div>
                
                {/* Service Status */}
                {(token.services?.gmail || token.services?.calendar) && (
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    {token.services.gmail && (
                      <div className="flex items-center gap-1">
                        {token.services.gmail.success ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className={token.services.gmail.success ? "text-green-700" : "text-red-700"}>
                          Gmail
                        </span>
                      </div>
                    )}
                    {token.services.calendar && (
                      <div className="flex items-center gap-1">
                        {token.services.calendar.success ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className={token.services.calendar.success ? "text-green-700" : "text-red-700"}>
                          Calendar
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Error Display */}
                {token.lastProbeError && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                    {token.lastProbeError}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {/* Health Check Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleHealthCheck(token.provider)}
                  disabled={runningHealthCheck === token.provider}
                  title="Run health check now"
                >
                  {runningHealthCheck === token.provider ? (
                    <>
                      <Activity className="h-3 w-3 mr-1 animate-pulse" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Activity className="h-3 w-3 mr-1" />
                      Check Now
                    </>
                  )}
                </Button>
                
                {/* Reconnect Button */}
                {(token.expired || token.tokenValidation?.needsRefresh || !token.connected) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReconnect(token.provider)}
                    disabled={reconnecting === token.provider}
                  >
                    {reconnecting === token.provider ? (
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
                {token.connected && !token.expired && !token.tokenValidation?.needsRefresh && onDisconnect && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDisconnect(token.provider)}
                  >
                    <Unlink className="h-3 w-3 mr-1" />
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {tokenHealth.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              No integrations connected yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
