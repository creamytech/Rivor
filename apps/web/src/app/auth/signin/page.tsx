"use client";
import { useEffect, useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Shield, CheckCircle, Users, ArrowRight, Sparkles, Lock, Eye, EyeOff, Waves } from "lucide-react";
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
    
    // Force dark theme on mobile - aggressive approach
    if (typeof window !== 'undefined') {
      // Set meta theme color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#000000');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#000000';
        document.head.appendChild(meta);
      }
      
      // Force dark styles on document
      document.documentElement.style.colorScheme = 'dark';
      document.documentElement.style.backgroundColor = '#000000';
      document.documentElement.style.color = '#ffffff';
      document.body.style.backgroundColor = '#000000';
      document.body.style.color = '#ffffff';
      
      // Add data attributes for dark theme
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-permanent-theme', 'black');
      document.body.setAttribute('data-glass-theme', 'black');
      document.body.setAttribute('data-permanent-theme', 'true');
      
      // Force override any theme context changes with !important styles
      const forceThemeStyle = document.getElementById('force-login-theme');
      if (forceThemeStyle) {
        forceThemeStyle.remove();
      }
      
      const style = document.createElement('style');
      style.id = 'force-login-theme';
      style.textContent = `
        html, body {
          background-color: #000000 !important;
          color: #ffffff !important;
        }
        * {
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        .glass-card, .glass-panel, .glass-button {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
        }
      `;
      document.head.appendChild(style);
    }
    
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
    if (expired) return "Session expired—let's get you back in";
    if (reauth) return "Let's reconnect your account";
    return "Welcome to Rivor";
  };

  const getSubMessage = () => {
    if (expired || reauth) return "Sign in securely to continue your workflow";
    return "Your intelligent real estate command center";
  };

  return (
    <div className="glass-theme-black min-h-screen relative overflow-hidden" role="main" data-glass-theme="black" data-permanent-theme="black" style={{backgroundColor: '#000000', color: '#ffffff'}}>
      {/* Flowing River Background */}
      <div className="absolute inset-0">
        {/* Main gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 via-purple-600/6 to-cyan-500/8" />
        <div className="absolute inset-0 bg-gradient-to-tl from-indigo-500/6 via-transparent to-teal-400/4" />
        
        {/* River animation layers */}
        <div className="river-container">
          {/* Layer 1 - Main river streams */}
          <div className="river-layer-1">
            <div className="river-stream w-80 top-[20%] left-0" />
            <div className="river-stream-reverse w-60 top-[25%] right-0" />
            <div className="river-current top-[22%] left-[20%]" />
            <div className="river-droplet top-[21%] left-[40%]" />
            <div className="river-droplet top-[24%] left-[70%]" />
          </div>
          
          {/* Layer 2 - Middle streams */}
          <div className="river-layer-2">
            <div className="river-stream w-96 top-[50%] left-0" />
            <div className="river-stream-reverse w-72 top-[55%] right-0" />
            <div className="river-current top-[52%] left-[30%]" />
            <div className="river-wave-line w-full top-[53%] left-0" />
            <div className="river-droplet top-[51%] left-[60%]" />
          </div>
          
          {/* Layer 3 - Lower streams */}
          <div className="river-layer-3">
            <div className="river-stream w-64 top-[75%] left-0" />
            <div className="river-stream-reverse w-88 top-[80%] right-0" />
            <div className="river-current top-[77%] left-[10%]" />
            <div className="river-droplet top-[76%] left-[50%]" />
            <div className="river-droplet top-[78%] left-[80%]" />
          </div>
          
          {/* Additional flowing elements for depth */}
          <div className="absolute top-[35%] left-[15%] w-32 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent river-wave-line" />
          <div className="absolute top-[65%] right-[20%] w-24 h-0.5 bg-gradient-to-r from-transparent via-blue-400/15 to-transparent river-wave-line" style={{animationDelay: '-3s'}} />
        </div>
        
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='0.3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Main Content */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4" aria-labelledby="signin-title">
        {/* Logo and branding */}
        <div className="mb-8 text-center animate-fade-up">
          <div className="relative inline-block mb-4">
            {/* Enhanced liquid glass backdrop */}
            <div 
              className="absolute -inset-4 rounded-3xl opacity-70"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(25px) saturate(1.8) brightness(1.1)',
                WebkitBackdropFilter: 'blur(25px) saturate(1.8) brightness(1.1)',
                boxShadow: `
                  inset 0 1px 0 rgba(255, 255, 255, 0.15),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1),
                  0 6px 25px rgba(6, 182, 212, 0.2),
                  0 12px 40px rgba(6, 182, 212, 0.15)
                `,
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            />
            {/* Liquid morphing border */}
            <div 
              className="absolute -inset-4 rounded-3xl opacity-50"
              style={{
                background: 'linear-gradient(45deg, rgba(6, 182, 212, 0.15) 0%, transparent 25%, rgba(147, 51, 234, 0.15) 50%, transparent 75%, rgba(6, 182, 212, 0.15) 100%)',
                animation: 'liquidMorph 10s ease-in-out infinite, gradientShift 8s ease-in-out infinite'
              }}
            />
            {/* Floating particles */}
            <div 
              className="absolute -inset-4 rounded-3xl"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
                animation: 'float 6s ease-in-out infinite'
              }}
            />
            <div className="relative p-6 z-10">
              <motion.img
                src='/images/Full%20Sidebar%20Dark%20Mode.svg'
                alt="Rivor"
                className="h-12 w-auto object-contain mx-auto"
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 0.8,
                  ease: [0.4, 0, 0.2, 1],
                  scale: { duration: 0.6, ease: "backOut" }
                }}
                whileHover={{
                  scale: 1.05,
                  filter: `
                    drop-shadow(0 0 15px rgba(6, 182, 212, 0.6))
                    drop-shadow(0 0 30px rgba(6, 182, 212, 0.3))
                    brightness(1.2)
                    saturate(1.3)
                  `
                }}
                style={{
                  filter: `
                    drop-shadow(0 0 12px rgba(6, 182, 212, 0.4))
                    drop-shadow(0 0 24px rgba(6, 182, 212, 0.2))
                    brightness(1.1)
                    saturate(1.2)
                  `,
                  maxWidth: '200px'
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2 text-cyan-300/80">
            <Waves className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium tracking-wider uppercase">Real Estate Intelligence</span>
            <Waves className="w-4 h-4 animate-pulse" style={{animationDelay: '0.5s'}} />
          </div>
        </div>

        {/* Main Login Card */}
        <div className="glass-card w-full max-w-md p-8 space-y-8 glass-morph glass-hover-tilt glass-magnetic glass-reflection group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/15 to-cyan-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-700 glass-glow gradient-animate" />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center space-y-4 mb-8">
              <h1 id="signin-title" className="text-3xl font-bold text-white drop-shadow-lg">
                {getHeaderMessage()}
              </h1>
              <p className="text-lg text-white/90 leading-relaxed drop-shadow-md">
                {getSubMessage()}
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-cyan-300/90">
                <Lock className="w-4 h-4 drop-shadow-sm" />
                <span className="drop-shadow-sm">Enterprise-grade security</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="glass-card border-red-500/30 bg-red-500/10 p-4 mb-6 glass-click-ripple" role="alert">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-300 mb-1">Authentication Failed</h3>
                    <div className="text-sm text-red-400">
                      {error === 'OAuthCallback' ? 'Authentication was interrupted. Please try again.' : 
                       error === 'AccessDenied' ? 'Access denied. Please check your permissions.' :
                       error === 'Configuration' ? 'Service temporarily unavailable. Please try again later.' :
                       error === 'Verification' ? 'Email verification required. Check your inbox.' :
                       error === 'RateLimited' ? 'Too many attempts. Please wait before trying again.' :
                       'An unexpected error occurred. Please try again.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                <div className="glass-card h-16 animate-pulse glass-shimmer" />
                <div className="glass-card h-16 animate-pulse glass-shimmer" />
              </div>
            )}

            {/* Provider Buttons */}
            {!loading && providers && (
              <div className="space-y-4">
                {providers.google && (
                  <button
                    ref={firstButtonRef}
                    onClick={() => handleSignIn('google')}
                    disabled={isSigningIn}
                    className="glass-button w-full group relative flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600/80 to-blue-500/80 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 glass-enhanced-ripple glass-hover-lift glass-pulse-sophisticated shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-400/40"
                    aria-label="Sign in with Google OAuth"
                  >
                    <svg className="w-6 h-6 mr-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isSigningIn && signInProvider === 'google' ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                        <span>Connecting to Google...</span>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1">Continue with Google</span>
                        <ArrowRight className="w-6 h-6 ml-4 transform group-hover:translate-x-2 transition-transform duration-300" />
                      </>
                    )}
                  </button>
                )}

                {(providers as any)['azure-ad'] && (
                  <button
                    onClick={() => handleSignIn('azure-ad')}
                    disabled={isSigningIn}
                    className="glass-button w-full group relative flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 glass-enhanced-ripple glass-hover-lift glass-pulse-sophisticated shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-purple-400/40"
                    aria-label="Sign in with Microsoft OAuth"
                  >
                    <svg className="w-6 h-6 mr-4" viewBox="0 0 24 24" fill="currentColor">
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
                        <ArrowRight className="w-6 h-6 ml-4 transform group-hover:translate-x-2 transition-transform duration-300" />
                      </>
                    )}
                  </button>
                )}

                {Object.keys(providers).length === 0 && (
                  <div className="glass-card text-center p-8 border-amber-500/30 bg-amber-500/10">
                    <div className="w-16 h-16 mx-auto mb-6 glass-bubble bg-gradient-to-br from-amber-400/20 to-amber-600/10 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-semibold glass-text-accent mb-3">
                      Setup Required
                    </h3>
                    <p className="text-base glass-text-secondary leading-relaxed">
                      No authentication providers configured. Contact your administrator.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Legal Links */}
            <div className="text-center pt-6 border-t border-white/20">
              <p className="text-sm text-white/70">
                By continuing, you agree to our{" "}
                <a href="/terms" className="text-cyan-300 hover:text-cyan-200 hover:underline transition-all duration-200">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-cyan-300 hover:text-cyan-200 hover:underline transition-all duration-200">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Security Badges Footer */}
        <footer className="mt-8 text-center max-w-md w-full" role="contentinfo">
          <div className="glass-panel p-4 glass-hover-pulse bg-white/5 border-white/10">
            <div className="flex items-center justify-center space-x-6 mb-4">
              <div className="flex items-center space-x-2 text-sm text-white/80">
                <div className="w-8 h-8 glass-bubble bg-gradient-to-br from-green-400/20 to-green-600/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-400" />
                </div>
                <span className="font-medium">SOC 2 Ready</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-white/80">
                <div className="w-8 h-8 glass-bubble bg-gradient-to-br from-blue-400/20 to-blue-600/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                </div>
                <span className="font-medium">OAuth 2.0</span>
              </div>
            </div>
            
            <a 
              href="/security" 
              className="glass-button inline-flex items-center space-x-2 text-sm text-cyan-300 hover:text-cyan-200 hover:scale-105 transition-all duration-300 px-6 py-2"
            >
              <Users className="w-4 h-4" />
              <span className="font-medium">Security Details</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </footer>
      </section>
    </div>
  );
}