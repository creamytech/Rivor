"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, RefreshCw, X } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";

interface TokenHealthBannerProps {
  className?: string;
}

interface IntegrationIssue {
  provider: string;
  issue: 'encryption_failed' | 'missing_tokens' | 'probe_failed' | 'insufficient_scopes';
  emailAccountId: string;
  message: string;
}

export default function TokenHealthBanner({ className }: TokenHealthBannerProps) {
  const [issues, setIssues] = useState<IntegrationIssue[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/integrations/status');
      if (response.ok) {
        const data = await response.json();
        const newIssues: IntegrationIssue[] = [];

        data.emailAccounts.forEach((account: any) => {
          if (account.requiresRetry || account.canReconnect) {
            let issue: IntegrationIssue['issue'] = 'encryption_failed';
            let message = '';

            switch (account.uiStatus) {
              case 'encryption_failed':
                issue = 'encryption_failed';
                message = `Token encryption failed for ${account.provider}. Your account connection is secure but some features may not work.`;
                break;
              case 'missing_tokens':
                issue = 'missing_tokens';
                message = `Missing authentication tokens for ${account.provider}. Please reconnect your account.`;
                break;
              case 'probe_failed':
                issue = 'probe_failed';
                message = `Health check failed for ${account.provider}. Your tokens may have expired or been revoked.`;
                break;
              case 'insufficient_scopes':
                issue = 'insufficient_scopes';
                message = `Insufficient permissions for ${account.provider}. Please reconnect to grant required access.`;
                break;
              default:
                message = `${account.provider} connection needs attention.`;
            }

            newIssues.push({
              provider: account.provider,
              issue,
              emailAccountId: account.id,
              message,
            });
          }
        });

        setIssues(newIssues);
      }
    } catch (error) {
      console.error('Failed to fetch integration issues:', error);
    }
  };

  const handleReconnect = async (provider: string) => {
    setLoading(provider);
    try {
      await signIn(provider, { callbackUrl: window.location.pathname });
    } catch (error) {
      console.error('Reconnect failed:', error);
      setLoading(null);
    }
  };

  const handleDismiss = (issueKey: string) => {
    setDismissed(prev => [...prev, issueKey]);
  };

  const visibleIssues = issues.filter(issue => {
    const issueKey = `${issue.provider}-${issue.issue}`;
    return !dismissed.includes(issueKey);
  });

  if (visibleIssues.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleIssues.map((issue) => {
        const issueKey = `${issue.provider}-${issue.issue}`;
        const isEncryptionIssue = issue.issue === 'encryption_failed';
        
        return (
          <Alert 
            key={issueKey} 
            variant={isEncryptionIssue ? "default" : "destructive"}
            className="border-l-4 border-l-orange-500"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {isEncryptionIssue ? (
                  <Shield className="h-5 w-5 text-orange-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription className="text-sm">
                    <div className="font-medium mb-1">
                      {isEncryptionIssue ? 'Security Notice' : 'Action Required'}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      {issue.message}
                    </div>
                    {isEncryptionIssue && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Your account is secure, but token encryption failed. This may be due to KMS being temporarily unavailable. 
                        Clicking "Retry" will attempt to re-encrypt your tokens.
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  variant={isEncryptionIssue ? "outline" : "default"}
                  onClick={() => handleReconnect(issue.provider)}
                  disabled={loading === issue.provider}
                  className="text-xs"
                >
                  {loading === issue.provider ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {isEncryptionIssue ? 'Retry' : 'Reconnect'}
                    </>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDismiss(issueKey)}
                  className="text-xs"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Alert>
        );
      })}
    </div>
  );
}