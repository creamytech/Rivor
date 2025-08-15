"use client";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { signIn } from "next-auth/react";

interface TokenHealthBannerProps {
  expiredProviders: string[];
  missingProviders: string[];
}

export default function TokenHealthBanner({ 
  expiredProviders, 
  missingProviders 
}: TokenHealthBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [reconnecting, setReconnecting] = useState<string | null>(null);

  const hasIssues = expiredProviders.length > 0 || missingProviders.length > 0;

  if (!hasIssues || dismissed) return null;

  const handleReconnect = async (provider: string) => {
    setReconnecting(provider);
    try {
      await signIn(provider, { callbackUrl: "/app" });
    } catch (error) {
      console.error("Reconnect failed:", error);
      setReconnecting(null);
    }
  };

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'google': return 'Google';
      case 'azure-ad': return 'Microsoft';
      default: return provider;
    }
  };

  return (
    <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
        <div className="flex-1">
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <div className="mb-3">
              <strong>Integration Status Issues Detected</strong>
            </div>
            
            {expiredProviders.length > 0 && (
              <div className="mb-2">
                Your {expiredProviders.map(getProviderDisplayName).join(', ')} 
                {expiredProviders.length === 1 ? ' token has' : ' tokens have'} expired. 
                Please reconnect to restore full functionality.
              </div>
            )}
            
            {missingProviders.length > 0 && (
              <div className="mb-3">
                Connect {missingProviders.map(getProviderDisplayName).join(', ')} 
                to access email and calendar features.
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {[...expiredProviders, ...missingProviders].map(provider => (
                <Button
                  key={provider}
                  size="sm"
                  variant="outline"
                  onClick={() => handleReconnect(provider)}
                  disabled={reconnecting === provider}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {reconnecting === provider ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {expiredProviders.includes(provider) ? 'Reconnect' : 'Connect'} {getProviderDisplayName(provider)}
                    </>
                  )}
                </Button>
              ))}
            </div>
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDismissed(true)}
          className="h-8 w-8 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
