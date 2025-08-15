"use client";
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { signIn } from 'next-auth/react';

interface TokenError {
  provider: string;
  emailAccountId: string;
  error: string;
  kmsErrorCode?: string;
}

export default function TokenErrorBanner() {
  const [tokenErrors, setTokenErrors] = useState<TokenError[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [reconnecting, setReconnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchTokenErrors();
  }, []);

  const fetchTokenErrors = async () => {
    try {
      const response = await fetch('/api/integrations/status');
      if (response.ok) {
        const data = await response.json();
        const errors: TokenError[] = [];
        
        data.emailAccounts?.forEach((account: any) => {
          if (account.encryptionStatus === 'failed' || account.tokenStatus === 'failed') {
            errors.push({
              provider: account.provider,
              emailAccountId: account.id,
              error: account.errorReason || 'Token encryption failed',
              kmsErrorCode: account.kmsErrorCode
            });
          }
        });
        
        setTokenErrors(errors);
      }
    } catch (error) {
      console.error('Failed to fetch token errors:', error);
    }
  };

  const handleReconnect = async (provider: string, emailAccountId: string) => {
    setReconnecting(emailAccountId);
    try {
      await signIn(provider, { callbackUrl: '/app' });
    } catch (error) {
      console.error('Reconnect failed:', error);
      setReconnecting(null);
    }
  };

  const handleDismiss = (emailAccountId: string) => {
    setDismissed(prev => new Set([...prev, emailAccountId]));
  };

  const visibleErrors = tokenErrors.filter(error => !dismissed.has(error.emailAccountId));

  if (visibleErrors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {visibleErrors.map((error) => (
        <Alert key={error.emailAccountId} variant="destructive" className="border-orange-200 bg-orange-50 text-orange-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <span className="font-medium">
                {error.provider === 'google' ? 'Google' : 'Microsoft'} connection needs attention
              </span>
              <div className="text-sm mt-1">
                {error.error}
                {error.kmsErrorCode && (
                  <span className="text-xs text-orange-700 ml-2">
                    Error code: {error.kmsErrorCode}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReconnect(error.provider, error.emailAccountId)}
                disabled={reconnecting === error.emailAccountId}
                className="bg-orange-100 border-orange-300 text-orange-900 hover:bg-orange-200"
              >
                {reconnecting === error.emailAccountId ? (
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
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(error.emailAccountId)}
                className="h-6 w-6 p-0 text-orange-600 hover:bg-orange-200"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
