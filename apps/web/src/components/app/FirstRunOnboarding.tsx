"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, ArrowRight, CheckCircle } from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import { useState } from "react";

interface FirstRunOnboardingProps {
  hasEmailIntegration: boolean;
  hasCalendarIntegration: boolean;
}

export default function FirstRunOnboarding({ 
  hasEmailIntegration, 
  hasCalendarIntegration 
}: FirstRunOnboardingProps) {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (provider: string) => {
    setConnecting(provider);
    try {
      // Force re-authentication to ensure we get the full scopes
      // by temporarily signing out and then signing back in
      console.log(`Forcing re-authentication for ${provider} to upgrade scopes`);
      
      // Store the current provider in localStorage to handle the re-auth flow
      localStorage.setItem('pendingOAuthUpgrade', provider);
      
      // Sign out first, then sign back in - this ensures NextAuth goes through 
      // the full OAuth flow and triggers the JWT callback with new scopes
      await signOut({ redirect: false });
      
      // Small delay to ensure signout completes
      setTimeout(async () => {
        await signIn(provider, { callbackUrl: "/app" });
      }, 100);
    } catch (error) {
      console.error("Connection failed:", error);
      localStorage.removeItem('pendingOAuthUpgrade');
      setConnecting(null);
    }
  };

  // If user has both integrations, don't show onboarding
  if (hasEmailIntegration && hasCalendarIntegration) {
    return null;
  }

  return (
    <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            Welcome to Rivor!
          </CardTitle>
        </div>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          Connect your accounts to start managing emails, calendar, and deals in one place.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google Integration */}
            <div className="p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Connect Google</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Access Gmail and Google Calendar to sync emails and events.
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs">
                      {hasEmailIntegration ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <Mail className="h-3 w-3 text-gray-400" />
                      )}
                      <span className={hasEmailIntegration ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}>
                        Gmail integration
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {hasCalendarIntegration ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <Calendar className="h-3 w-3 text-gray-400" />
                      )}
                      <span className={hasCalendarIntegration ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}>
                        Calendar integration
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleConnect('google')}
                    disabled={connecting === 'google' || (hasEmailIntegration && hasCalendarIntegration)}
                  >
                    {connecting === 'google' ? 'Connecting...' : 
                     (hasEmailIntegration && hasCalendarIntegration) ? 'Connected' : 'Connect Google'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Microsoft Integration */}
            <div className="p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Connect Microsoft</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Access Outlook and Microsoft Calendar for comprehensive email and scheduling.
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs">
                      {hasEmailIntegration ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <Mail className="h-3 w-3 text-gray-400" />
                      )}
                      <span className={hasEmailIntegration ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}>
                        Outlook integration
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {hasCalendarIntegration ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <Calendar className="h-3 w-3 text-gray-400" />
                      )}
                      <span className={hasCalendarIntegration ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}>
                        Calendar integration
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full"
                    onClick={() => handleConnect('azure-ad')}
                    disabled={connecting === 'azure-ad' || (hasEmailIntegration && hasCalendarIntegration)}
                  >
                    {connecting === 'azure-ad' ? 'Connecting...' : 
                     (hasEmailIntegration && hasCalendarIntegration) ? 'Connected' : 'Connect Microsoft'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500 mb-2">
              You can connect multiple accounts or switch providers anytime in Settings.
            </p>
            <p className="text-xs text-gray-500">
              🔐 Your data is encrypted and secure. We only access what you authorize.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
