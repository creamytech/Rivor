"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { AlertTriangle, RefreshCw, Home, Mail, Shield, Users } from "lucide-react";
import Logo from "@/components/branding/Logo";

type Providers = Record<string, { id: string; name: string }>;

export default function AuthErrorPage() {
  const isClient = typeof window !== 'undefined';
  const params = isClient ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const error = isClient ? params.get('error') : null;
  const [providers, setProviders] = useState<Providers | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryProvider, setRetryProvider] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/providers');
        if (!res.ok) throw new Error('providers');
        const json = await res.json();
        if (!cancelled) setProviders(json);
      } catch {
        if (!cancelled) setProviders({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleRetry = async (provider: string) => {
    setIsRetrying(true);
    setRetryProvider(provider);
    
    try {
      await signIn(provider, { callbackUrl: '/app' });
    } catch (retryError) {
      console.error('Retry sign in error:', retryError);
      setIsRetrying(false);
      setRetryProvider(null);
    }
  };

  const getErrorDetails = (errorCode: string | null) => {
    switch (errorCode) {
      case 'OAuthCallback':
        return {
          title: "Authentication callback failed",
          description: "We couldn't complete sign-in. Try again or use a different provider.",
          canRetry: true
        };
      case 'AccessDenied':
        return {
          title: "Access was denied",
          description: "Please check your permissions and try again. You may need to grant access to your email and calendar.",
          canRetry: true
        };
      case 'Configuration':
        return {
          title: "Provider unavailable",
          description: "The authentication service is temporarily unavailable. Please try again later.",
          canRetry: true
        };
      case 'Verification':
        return {
          title: "Email verification required",
          description: "Please check your inbox and verify your email address before signing in.",
          canRetry: false
        };
      case 'Callback':
        return {
          title: "Authentication failed",
          description: "There was an issue processing your sign-in. Please try again.",
          canRetry: true
        };
      case 'Timeout':
        return {
          title: "Request timed out",
          description: "The sign-in process took too long. Please check your connection and try again.",
          canRetry: true
        };
      case 'RateLimited':
        return {
          title: "Too many attempts",
          description: "Please wait a few minutes before trying to sign in again.",
          canRetry: false
        };
      default:
        return {
          title: "Sign-in failed",
          description: "An unexpected error occurred during sign-in. Please try again.",
          canRetry: true
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="glass-theme-black min-h-screen relative overflow-hidden" data-glass-theme="black">
      <div className="absolute inset-0 wave-gradient" />
      <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full animate-float" />
      <div className="absolute bottom-32 right-32 w-32 h-32 bg-white/5 rounded-full animate-float-delay" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div>
          <div className="card p-8 space-y-6 animate-fade-up">
            <div className="text-center">
              <Logo className="mx-auto mb-6 h-10" />
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-display-md text-foreground">
                  {errorDetails.title}
                </h1>
                <p className="text-body-md text-muted-foreground">
                  {errorDetails.description}
                </p>
              </div>
            </div>

            {errorDetails.canRetry && (
              <div className="space-y-3">
                {loading && (
                  <div className="space-y-3 animate-fade-up-delay-2">
                    <div className="skeleton h-12 rounded-lg" />
                    <div className="skeleton h-12 rounded-lg" />
                  </div>
                )}
                
                {!loading && providers && providers.google && (
                  <button
                    onClick={() => handleRetry('google')}
                    disabled={isRetrying}
                    className="btn-primary hover-lift focus-flow w-full group relative flex items-center justify-center px-6 py-4 text-base font-medium rounded-lg text-white bg-[#4285F4] hover:bg-[#3367D6] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 animate-fade-up-delay-2"
                    aria-label="Retry with Google"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#FFFFFF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FFFFFF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#FFFFFF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isRetrying && retryProvider === 'google' ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Retrying...
                      </div>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry with Google
                      </>
                    )}
                  </button>
                )}

                {!loading && providers && (providers as unknown)['azure-ad'] && (
                  <button
                    onClick={() => handleRetry('azure-ad')}
                    disabled={isRetrying}
                    className="btn-primary hover-lift focus-flow w-full group relative flex items-center justify-center px-6 py-4 text-base font-medium rounded-lg text-white bg-[#0078D4] hover:bg-[#106EBE] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 animate-fade-up-delay-3"
                    aria-label="Retry with Microsoft"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                    </svg>
                    {isRetrying && retryProvider === 'azure-ad' ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Retrying...
                      </div>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry with Microsoft
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            <div className="border-t border-border pt-6 space-y-3">
              <a
                href="/"
                className="w-full flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg text-muted-foreground bg-muted hover:bg-muted/80 transition-colors animate-fade-up-delay-4"
              >
                <Home className="w-4 h-4 mr-2" />
                Return to home
              </a>
              
              <div className="flex space-x-3">
                <a
                  href="/help"
                  className="flex-1 flex items-center justify-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </a>
                <a
                  href="https://status.rivor.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  System Status
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center animate-fade-up-delay-5">
            <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>SOC 2 ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>OAuth 2.0</span>
              </div>
              <a href="/security" className="flex items-center space-x-2 hover:text-foreground transition-colors">
                <Users className="w-4 h-4" />
                <span>Security</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}