"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, RefreshCw, Mail, Calendar, X, Plus } from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { TokenHealth } from "@/server/oauth";

interface ConnectedAccountsPanelProps {
  tokenHealth: TokenHealth[];
  userEmail: string;
  userName: string;
}

export default function ConnectedAccountsPanel({ 
  tokenHealth, 
  userEmail, 
  userName 
}: ConnectedAccountsPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleReconnect = async (provider: string) => {
    setLoading(provider);
    try {
      // Force re-authentication to upgrade scopes
      await signOut({ redirect: false });
      setTimeout(async () => {
        await signIn(provider, { callbackUrl: "/app/settings" });
      }, 100);
    } catch (error) {
      console.error("Reconnect failed:", error);
      setLoading(null);
    }
  };

  const handleConnect = async (provider: string) => {
    setLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/app/settings" });
    } catch (error) {
      console.error("Connection failed:", error);
      setLoading(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    setLoading(provider);
    try {
      // Call API to remove OAuth account
      const response = await fetch('/api/auth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });
      
      if (response.ok) {
        window.location.reload(); // Refresh to show updated state
      } else {
        console.error('Disconnect failed');
      }
    } catch (error) {
      console.error("Disconnect failed:", error);
    } finally {
      setLoading(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'azure-ad':
        return (
          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
          </svg>
        );
      default:
        return <Mail className="w-6 h-6" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google': return 'Google';
      case 'azure-ad': return 'Microsoft';
      default: return provider;
    }
  };

  const getProviderEmail = (provider: string) => {
    // For now, we'll use the user's email, but in the future we could store
    // provider-specific emails if they're different
    return userEmail;
  };

  const hasRequiredScopes = (account: TokenHealth) => {
    if (account.provider === 'google') {
      return account.scopes.includes('https://www.googleapis.com/auth/gmail.readonly') &&
             account.scopes.includes('https://www.googleapis.com/auth/calendar.readonly');
    } else if (account.provider === 'azure-ad') {
      return account.scopes.includes('https://graph.microsoft.com/Mail.Read') &&
             account.scopes.includes('https://graph.microsoft.com/Calendars.ReadWrite');
    }
    return false;
  };

  const connectedAccounts = tokenHealth.filter(t => t.connected);
  const googleAccount = connectedAccounts.find(t => t.provider === 'google');
  const microsoftAccount = connectedAccounts.find(t => t.provider === 'azure-ad');

  return (
    <div className="space-y-6">
      {/* Connected Accounts */}
      {connectedAccounts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Connected Accounts</h3>
          
          {connectedAccounts.map((account) => {
            const hasFullScopes = hasRequiredScopes(account);
            const isExpired = account.expired;
            
            return (
              <Card key={account.provider}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {getProviderIcon(account.provider)}
                    <div>
                      <div className="font-semibold">{getProviderName(account.provider)}</div>
                      <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
                        {getProviderEmail(account.provider)}
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {account.provider === 'google' 
                      ? 'Access to Gmail and Google Calendar' 
                      : 'Access to Outlook and Microsoft Calendar'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {isExpired ? (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        ) : hasFullScopes ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm font-medium">
                          {isExpired 
                            ? 'Token Expired' 
                            : hasFullScopes 
                              ? 'Fully Connected' 
                              : 'Limited Access'
                          }
                        </span>
                      </div>
                      <Badge variant={isExpired ? "destructive" : hasFullScopes ? "default" : "secondary"}>
                        {isExpired ? 'Expired' : hasFullScopes ? 'Healthy' : 'Partial'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReconnect(account.provider)}
                        disabled={loading === account.provider}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        {loading === account.provider ? 'Connecting...' : 'Reconnect'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDisconnect(account.provider)}
                        disabled={loading === account.provider}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                  
                  {/* Capabilities */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="text-sm font-medium">Capabilities</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        {account.scopes.includes('https://www.googleapis.com/auth/gmail.readonly') ||
                         account.scopes.includes('https://graph.microsoft.com/Mail.Read') ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-red-500" />
                        )}
                        <Mail className="h-3 w-3" />
                        <span>Email access</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {account.scopes.includes('https://www.googleapis.com/auth/calendar.readonly') ||
                         account.scopes.includes('https://graph.microsoft.com/Calendars.ReadWrite') ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-red-500" />
                        )}
                        <Calendar className="h-3 w-3" />
                        <span>Calendar access</span>
                      </div>
                    </div>
                  </div>

                  {/* Scopes */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="text-sm font-medium">Permissions & Scopes</div>
                    <div className="flex flex-wrap gap-1">
                      {account.scopes.map((scope) => (
                        <Badge key={scope} variant="outline" className="text-xs">
                          {scope.replace('https://www.googleapis.com/auth/', '')
                                .replace('https://graph.microsoft.com/', '')
                                .replace('openid', 'OpenID')
                                .replace('email', 'Email')
                                .replace('profile', 'Profile')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Last updated: {new Date(account.lastUpdated).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Available Providers */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Integrations</h3>
        
        {/* Google */}
        {!googleAccount && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {getProviderIcon('google')}
                <div>Google</div>
              </CardTitle>
              <CardDescription>
                Connect your Google account to sync Gmail and Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Not Connected</span>
                  </div>
                </div>
                <Button 
                  onClick={() => handleConnect('google')}
                  disabled={loading === 'google'}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {loading === 'google' ? 'Connecting...' : 'Connect Google'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Microsoft */}
        {!microsoftAccount && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {getProviderIcon('azure-ad')}
                <div>Microsoft</div>
              </CardTitle>
              <CardDescription>
                Connect your Microsoft account to sync Outlook and Microsoft Calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Not Connected</span>
                  </div>
                </div>
                <Button 
                  onClick={() => handleConnect('azure-ad')}
                  disabled={loading === 'azure-ad'}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {loading === 'azure-ad' ? 'Connecting...' : 'Connect Microsoft'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
