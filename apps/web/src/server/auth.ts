import { prisma } from "./db";
import { enqueueEmailSync } from "./queue";
import { type NextAuthOptions, getServerSession } from "next-auth";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";
import { createKmsClient, generateDek } from "@rivor/crypto";
import { getEnv } from "./env";
import { encryptForOrg } from "./crypto";
import { logger } from "@/lib/logger";
import { handleOAuthCallback, isDuplicateCallback, type OAuthCallbackData } from "./onboarding";
import { enqueueTokenEncryption, enqueueOnboarding, enqueueOrgSetup } from "./auth-background";
import { syncUserSessions } from "./session-sync";
import { validateAndLogStartupConfig } from "./env";
import { createCustomPrismaAdapter } from "./auth-adapter";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { logOAuth } from "@/lib/oauth-logger";

const providers: unknown[] = [];

// Microsoft OAuth (always enabled if configured)
const REQUIRED_MICROSOFT_SCOPES = "openid email profile offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read";
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  providers.push(AzureAD({
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    tenantId: process.env.MICROSOFT_TENANT_ID ?? "common",
    authorization: { 
      params: { 
        scope: process.env.MICROSOFT_OAUTH_SCOPES || REQUIRED_MICROSOFT_SCOPES
      } 
    },
  }));
}

// Google OAuth (enabled if configured) - Complete permissions for email and calendar
const REQUIRED_GOOGLE_SCOPES = "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events";
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: process.env.GOOGLE_OAUTH_SCOPES || REQUIRED_GOOGLE_SCOPES,
        },
      },
    })
  );
}

// Debug logging for providers
console.log('🔍 Provider configuration check:', {
  googleClientId: !!process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  microsoftClientId: !!process.env.MICROSOFT_CLIENT_ID,
  providersLength: providers.length,
  timestamp: new Date().toISOString()
});

// Only Google and Microsoft providers are supported
if (providers.length === 0) {
  console.error("🚨 No OAuth providers configured. Please set up Google or Microsoft OAuth credentials.");
  console.error("Environment check:", {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET?.substring(0, 5) + '...',
    NODE_ENV: process.env.NODE_ENV
  });
} else {
  console.log('✅ OAuth providers loaded successfully:', providers.length);
}

// Validate startup configuration on module load
validateAndLogStartupConfig();

// Ensure we always have Google provider if credentials exist
const finalProviders = providers.length > 0 ? providers : [
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: process.env.GOOGLE_OAUTH_SCOPES || REQUIRED_GOOGLE_SCOPES,
        },
      },
    })
  ] : [])
];

console.log('🚀 Final providers array length:', finalProviders.length);

export const authOptions: NextAuthOptions = {
  adapter: createCustomPrismaAdapter(), // Proper KMS encryption
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: true, // Enable debug mode temporarily
  secret: process.env.NEXTAUTH_SECRET,
  providers: finalProviders,
  session: { 
    strategy: "database",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 5 * 60,    // 5 minutes - faster session sync
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log('🔐 OAuth callback reached', {
        provider: account?.provider,
        userEmail: user.email,
        hasAccessToken: !!account?.access_token,
        hasRefreshToken: !!account?.refresh_token,
        timestamp: new Date().toISOString()
      });

      // Log successful sign in
      if (user.email && account?.provider) {
        logger.authEvent('signin', user.email, account.provider, true);
      }
      
      // Clean up any expired sessions first
      try {
        const { cleanupExpiredSessions } = await import("./session-sync");
        await cleanupExpiredSessions();
        console.log('✅ Expired sessions cleaned up during sign-in');
      } catch (error) {
        logger.error('Failed to cleanup expired sessions', { error: error?.message || error });
      }
      
      // Trigger cross-device session sync for same Google account
      if (user.email) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
          if (dbUser) {
            // Sync sessions across devices asynchronously
            syncUserSessions(dbUser.id).catch(error => {
              logger.error('Session sync failed during signIn', { 
                userId: dbUser.id, 
                error: error?.message || error 
              });
            });
            console.log('✅ Session sync triggered for cross-device auth');
          }
        } catch (error) {
          logger.error('Failed to trigger session sync', { 
            userEmail: user.email, 
            error: error?.message || error 
          });
        }
      }
    },
    
    async signOut({ token, session }) {
      console.log('🚪 User signing out', {
        userEmail: session?.user?.email || token?.email,
        timestamp: new Date().toISOString()
      });

      // Clean up background jobs and sessions
      try {
        if (session?.user?.email || token?.email) {
          const userEmail = session?.user?.email || token?.email;
          const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
          
          if (dbUser) {
            // Clean up background jobs for this user
            const { cleanupUserJobs } = await import("./auth-background");
            cleanupUserJobs(userEmail); // Use email as userId for jobs
            console.log('✅ Background jobs cleaned up during sign-out');
            
            // Clean up user's sessions to prevent conflicts on re-login
            await prisma.session.deleteMany({
              where: { 
                userId: dbUser.id,
                expires: { lt: new Date(Date.now() + 5 * 60 * 1000) } // Clean sessions expiring in next 5 minutes
              }
            });
            console.log('✅ User sessions cleaned up during sign-out');
          }
        }

        // Clean up any expired sessions globally
        const { cleanupExpiredSessions } = await import("./session-sync");
        await cleanupExpiredSessions();
        console.log('✅ Expired sessions cleaned up during sign-out');
      } catch (error) {
        logger.error('Failed to cleanup sessions during sign-out', { 
          error: error?.message || error 
        });
      }

      // Log successful sign out
      if (session?.user?.email || token?.email) {
        logger.authEvent('signout', session?.user?.email || token?.email || 'unknown', 'system', true);
      }
    },
    
    async linkAccount({ user, account, profile }) {
      console.log('🔗 OAuth linkAccount event', {
        provider: account.provider,
        userEmail: user.email,
        timestamp: new Date().toISOString()
      });
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      const signInData = {
        provider: account?.provider,
        userEmail: user.email,
        hasAccount: !!account,
        hasProfile: !!profile,
        timestamp: new Date().toISOString()
      };
      
      logOAuth('info', '🚀 OAuth signIn callback triggered', signInData);
      console.log('🚀 OAuth signIn callback start', signInData);
      
      // NextAuth should create User and Account records automatically with database strategy
      // This callback just validates the sign-in is allowed
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Enhanced redirect logic for deep links and user flow
      const redirectData = { url, baseUrl };
      logOAuth('info', '🔄 OAuth redirect callback', redirectData);
      console.log('Redirect callback:', redirectData);
      
      // If the URL is relative or matches our domain, use it
      if (url.startsWith("/") || url.startsWith(baseUrl)) {
        // Handle auth callback URLs - extract original destination if available
        if (url.includes('/api/auth/callback')) {
          const callbackUrl = new URL(url);
          const originalUrl = callbackUrl.searchParams.get('callbackUrl');
          
          if (originalUrl) {
            // Validate that it's a safe internal URL
            if (originalUrl.startsWith('/app') || originalUrl.startsWith('/inbox') || 
                originalUrl.startsWith('/calendar') || originalUrl.startsWith('/contacts') ||
                originalUrl.startsWith('/tasks') || originalUrl.startsWith('/analytics') ||
                originalUrl.startsWith('/settings')) {
              console.log('Redirecting to original deep link:', originalUrl);
              return `${baseUrl}${originalUrl}`;
            }
          }
          
          console.log('Redirecting to /app from callback');
          return `${baseUrl}/app`;
        }
        
        // Handle base URL redirects
        if (url === baseUrl || url === `${baseUrl}/` || url === '/') {
          return `${baseUrl}/app`;
        }
        
        // For other internal URLs, use as-is (already validated above)
        return url;
      }
      
      // For external URLs, redirect to app for security
      console.log('External URL detected, redirecting to /app');
      return `${baseUrl}/app`;
    },
    async session({ session, token }) {
      (session as unknown).orgId = token.orgId;
      (session as unknown).user = token.user || {
        email: session.user?.email || '',
        name: session.user?.name || '',
        image: session.user?.image || '',
        provider: 'unknown',
        providerId: ''
      };
      return session;
    },
    async jwt({ token, user, account, profile }) {
      // On sign in (including re-auth), perform minimal operations for fast auth
      if (user && account) {
        console.log('🔐 JWT callback triggered (optimized):', {
          userEmail: user.email,
          accountProvider: account.provider,
          hasAccessToken: !!account.access_token
        });
        
        try {
          // 1. Ensure basic user record exists (minimal required operation)
          if (user.email) {
            await prisma.user.upsert({
              where: { email: user.email },
              update: {
                name: user.name || undefined,
                image: user.image || undefined,
              },
              create: {
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                emailVerified: new Date(),
              },
            });
            console.log('✅ User record created/updated for:', user.email);
          }

          // 2. Create minimal Account record WITHOUT encryption (defer to background)
          const externalAccountId = account.providerAccountId || (profile as unknown)?.sub || (profile as unknown)?.id || 'unknown';
          const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
          
          if (dbUser) {
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: externalAccountId
                }
              },
              update: {
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                session_state: account.session_state,
              },
              create: {
                userId: dbUser.id,
                type: account.type || 'oauth',
                provider: account.provider,
                providerAccountId: externalAccountId,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                session_state: account.session_state,
              }
            });
            console.log('✅ NextAuth Account record created (tokens deferred)');
          }

          // 3. Set minimal required token data for immediate auth success
          (token as unknown).orgId = 'default'; // Use default immediately
          (token as unknown).user = {
            email: user.email || '',
            name: user.name || '',
            image: user.image || '',
            provider: account.provider,
            providerId: externalAccountId,
          };

          // 4. Queue heavy operations in background (non-blocking) - with duplicate protection
          if (user.email) {
            // Add a slight delay to prevent duplicate job queuing for rapid sign-in/out cycles
            setTimeout(() => {
              // Queue token encryption for background processing
              enqueueTokenEncryption(user.email!, 'default', account, externalAccountId);
              
              // Queue org setup for background processing
              enqueueOrgSetup(user.email!, user.email!);
              
              // Queue onboarding for background processing
              const onboardingData: OAuthCallbackData = {
                userId: user.email!,
                userEmail: user.email!,
                userName: user.name || profile?.name || '',
                userImage: user.image || (profile as unknown)?.picture || '',
                provider: account.provider,
                externalAccountId,
                account,
                profile,
              };
              enqueueOnboarding(onboardingData);
              
              console.log('✅ Heavy operations queued for background processing');
            }, 500); // 500ms delay to ensure auth completes first
          }

        } catch (error: unknown) {
          logger.error('JWT callback minimal processing failed', {
            userId: user.email || '',
            provider: account.provider,
            error: error?.message || error,
          });
          
          // Fallback behavior - continue auth with defaults
          (token as unknown).orgId = 'default';
          (token as unknown).user = {
            email: user.email || '',
            name: user.name || '',
            image: user.image || '',
            provider: account.provider,
            providerId: account.providerAccountId || '',
          };
        }
      }
      
      // Always ensure we have an orgId (minimal operation)
      if (!(token as unknown).orgId) {
        (token as unknown).orgId = 'default';
      }
      
      return token;
    },
  },
};

// v4 compatibility: provide an auth() helper for server components/routes
export const auth = async () => {
  try {
    // Use our working custom adapter instead of broken getServerSession
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('__Secure-next-auth.session-token')?.value || 
                        cookieStore.get('next-auth.session-token')?.value;

    if (!sessionToken) {
      return null;
    }

    const adapter = createCustomPrismaAdapter();
    if (!adapter.getSessionAndUser) {
      return null;
    }

    const result = await adapter.getSessionAndUser(sessionToken);
    if (!result || !result.session || !result.user) {
      return null;
    }

    // Return session in NextAuth format (keep it simple to avoid breaking auth)
    return {
      user: {
        email: result.user.email,
        name: result.user.name,
        image: result.user.image,
      },
      expires: result.session.expires.toISOString(),
      orgId: 'default' // Use default org for now
    };
  } catch (error) {
    console.error('Auth helper failed:', error);
    return null;
  }
};


