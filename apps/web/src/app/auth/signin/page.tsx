"use client";
import { useEffect, useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { Shield, CheckCircle, Users, ArrowRight, Sparkles, Lock, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/branding/Logo";

type Providers = Record<string, { id: string; name: string }>;

export default function SignInPage() {
  const isClient = typeof window !== 'undefined';
  const params = isClient ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const error = isClient ? params.get('error') : null;
  const reauth = isClient ? params.get('reauth') === 'true' : false;
  const expired = isClient ? params.get('expired') === 'true' : false;
  const [providers, setProviders] = useState<Providers | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInProvider, setSignInProvider] = useState<string | null>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

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

  const handleSignIn = async (provider: string) => {
    setIsSigningIn(true);
    setSignInProvider(provider);
    
    try {
      await signIn(provider, { callbackUrl: '/app' });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsSigningIn(false);
      setSignInProvider(null);
    }
  };

  const getHeaderMessage = () => {
    if (expired) return "Welcome back! Your session expired—sign in to continue.";
    if (reauth) return "Welcome back! Let's reconnect your account to keep going.";
    return "Welcome back! Let's get you into Rivor.";
  };

  const getSubMessage = () => {
    return "Secure SSO via Google or Microsoft—no password stored.";
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[var(--rivor-deep)] via-[var(--rivor-indigo)] to-[var(--rivor-deep)]" role="main">
      {/* Enhanced background with multiple gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[var(--rivor-teal)]/10 to-[var(--rivor-aqua)]/5" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--rivor-indigo)_0%,transparent_50%)] opacity-30" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,var(--rivor-teal)_0%,transparent_50%)] opacity-20" aria-hidden="true" />
      
      {/* Floating elements with improved positioning and animations */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-[var(--rivor-aqua)]/10 to-[var(--rivor-teal)]/5 rounded-full blur-xl animate-float" aria-hidden="true" />
      <div className="absolute bottom-32 right-32 w-32 h-32 bg-gradient-to-tl from-[var(--rivor-indigo)]/15 to-transparent rounded-full blur-lg animate-float-delay" aria-hidden="true" />
      <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-[var(--rivor-aqua)]/10 rounded-full blur-md animate-pulse" aria-hidden="true" />
      <div className="absolute top-1/4 left-1/2 w-16 h-16 bg-[var(--rivor-teal)]/8 rounded-full blur-sm animate-float" style={{animationDelay: '1.5s'}} aria-hidden="true" />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, var(--rivor-aqua) 1px, transparent 0)', backgroundSize: '20px 20px'}} aria-hidden="true" />
      
      <section className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8" aria-labelledby="signin-title">
        <div className="card p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8 animate-fade-up max-w-md mx-auto relative group">
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--rivor-indigo)]/20 via-[var(--rivor-teal)]/10 to-[var(--rivor-aqua)]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
          <div className="relative z-10">
            <div className="text-center">
              <div className="mb-8">
                <Logo className="mx-auto h-12" size="lg" />
                <div className="flex items-center justify-center mt-3 space-x-1">
                  <Sparkles className="w-3 h-3 text-[var(--rivor-aqua)] animate-pulse" />
                  <div className="text-xs text-[var(--rivor-aqua)] font-medium tracking-wide">REAL ESTATE CRM</div>
                  <Sparkles className="w-3 h-3 text-[var(--rivor-aqua)] animate-pulse" style={{animationDelay: '0.5s'}} />
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <h1 id="signin-title" className="text-display-md text-foreground leading-tight">
                {getHeaderMessage()}
              </h1>
              <div className="space-y-2">
                <p className="text-body-lg text-muted-foreground leading-relaxed">
                  {getSubMessage()}
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-[var(--rivor-aqua)]/80">
                  <Lock className="w-4 h-4" />
                  <span>Enterprise-grade security</span>
                </div>
              </div>
            </div>

            {error && (
            <div 
              className="card-subtle border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20 p-4 animate-fade-up-delay-1"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Sign-in failed
                  </h3>
                  <div id="error-description" className="text-sm text-red-700 dark:text-red-300">
                    {error === 'OAuthCallback' ? 'We couldn\'t complete sign-in. Try again or use a different provider.' : 
                     error === 'AccessDenied' ? 'Access was denied. Please check your permissions and try again.' :
                     error === 'Configuration' ? 'Provider unavailable. Please try again later.' :
                     error === 'Verification' ? 'Email verification required. Check your inbox.' :
                     error === 'RateLimited' ? 'Too many sign-in attempts. Please wait a few minutes before trying again.' :
                     'An error occurred during sign-in. Please try again.'}
                  </div>
                </div>
              </div>
            </div>
          )}

            <div className="space-y-4">
              {loading && (
                <div className="space-y-4 animate-fade-up-delay-2">
                  <div className="skeleton h-14 rounded-xl" />
                  <div className="skeleton h-14 rounded-xl" />
                </div>
              )}
            
              {!loading && providers && providers.google && (
                <button
                  ref={firstButtonRef}
                  onClick={() => handleSignIn('google')}
                  disabled={isSigningIn}
                  className="btn-primary hover-lift focus-flow w-full group relative flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl text-white bg-[#4285F4] hover:bg-[#3367D6] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 animate-fade-up-delay-2 shadow-lg shadow-[#4285F4]/25 hover:shadow-xl hover:shadow-[#4285F4]/40 border border-[#4285F4]/20"
                  aria-label="Sign in with Google. We never store your password; sign-in happens with your provider."
                  aria-describedby={error ? "error-description" : undefined}
                >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#FFFFFF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FFFFFF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#FFFFFF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                  {isSigningIn && signInProvider === 'google' ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                      <span>Connecting to Google...</span>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1">Continue with Google</span>
                      <ArrowRight className="w-5 h-5 ml-3 transform group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
              </button>
            )}

              {!loading && providers && (providers as unknown)['azure-ad'] && (
                <button
                  onClick={() => handleSignIn('azure-ad')}
                  disabled={isSigningIn}
                  className="btn-primary hover-lift focus-flow w-full group relative flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl text-white bg-[#0078D4] hover:bg-[#106EBE] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 animate-fade-up-delay-3 shadow-lg shadow-[#0078D4]/25 hover:shadow-xl hover:shadow-[#0078D4]/40 border border-[#0078D4]/20"
                  aria-label="Sign in with Microsoft. We never store your password; sign-in happens with your provider."
                  aria-describedby={error ? "error-description" : undefined}
                >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                </svg>
                  {isSigningIn && signInProvider === 'azure-ad' ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                      <span>Connecting to Microsoft...</span>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1">Continue with Microsoft</span>
                      <ArrowRight className="w-5 h-5 ml-3 transform group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
              </button>
            )}

              {!loading && providers && Object.keys(providers).length === 0 && (
                <div className="card-subtle text-center p-8 animate-fade-up-delay-2 border-amber-200/20 bg-amber-50/5">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/10 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Authentication Setup Required
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    No authentication providers are configured. Please contact your administrator to set up OAuth credentials.
                  </p>
                </div>
              )}
            </div>

            <div className="text-center animate-fade-up-delay-4 pt-4 border-t border-[var(--border)]/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                By continuing, you agree to our{" "}
                <a href="/terms" className="text-[var(--rivor-teal)] hover:text-[var(--rivor-aqua)] transition-colors duration-200 underline underline-offset-2 hover:no-underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-[var(--rivor-teal)] hover:text-[var(--rivor-aqua)] transition-colors duration-200 underline underline-offset-2 hover:no-underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center animate-fade-up-delay-5" role="contentinfo">
          <div className="max-w-md mx-auto">
            {/* Trust badges */}
            <div className="flex items-center justify-center space-x-6 sm:space-x-8 mb-6">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground/80" role="img" aria-label="SOC 2 compliance ready">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400/20 to-green-600/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-400" aria-hidden="true" />
                </div>
                <span className="font-medium">SOC 2 Ready</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground/80" role="img" aria-label="OAuth 2.0 authentication">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400/20 to-blue-600/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <span className="font-medium">OAuth 2.0</span>
              </div>
            </div>
            
            {/* Security link */}
            <a 
              href="/security" 
              className="inline-flex items-center space-x-2 text-sm text-[var(--rivor-teal)] hover:text-[var(--rivor-aqua)] transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--rivor-teal)]/50 rounded-lg px-3 py-2"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium">View Security Details</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </footer>
      </section>
    </div>
  );
}