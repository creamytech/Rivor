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
// import { createCustomPrismaAdapter } from "./auth-adapter";
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

// Create a comprehensive logging wrapper around PrismaAdapter to debug what methods are called
const baseAdapter = PrismaAdapter(prisma);
const loggingAdapter = {
  ...baseAdapter,
  async createUser(user: any) {
    try {
      console.log('🔍 PrismaAdapter.createUser called:', user);
      logOAuth('info', '🔍 PrismaAdapter.createUser called', user);
      const result = await baseAdapter.createUser!(user);
      console.log('✅ PrismaAdapter.createUser result:', result);
      logOAuth('info', '✅ PrismaAdapter.createUser success', { userId: result.id });
      return result;
    } catch (error) {
      console.error('❌ PrismaAdapter.createUser failed:', error);
      logOAuth('error', '❌ PrismaAdapter.createUser failed', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  },
  async linkAccount(account: any) {
    try {
      console.log('🔍 PrismaAdapter.linkAccount called:', account);
      logOAuth('info', '🔍 PrismaAdapter.linkAccount called', account);
      const result = await baseAdapter.linkAccount!(account);
      console.log('✅ PrismaAdapter.linkAccount result:', result);
      logOAuth('info', '✅ PrismaAdapter.linkAccount success', { provider: result.provider });
      return result;
    } catch (error) {
      console.error('❌ PrismaAdapter.linkAccount failed:', error);
      logOAuth('error', '❌ PrismaAdapter.linkAccount failed', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  },
  async createSession(session: any) {
    try {
      console.log('🔍 PrismaAdapter.createSession called:', session);
      logOAuth('info', '🔍 PrismaAdapter.createSession called', session);
      const result = await baseAdapter.createSession!(session);
      console.log('✅ PrismaAdapter.createSession result:', result);
      logOAuth('info', '✅ PrismaAdapter.createSession success', { sessionId: result.id });
      return result;
    } catch (error) {
      console.error('❌ PrismaAdapter.createSession failed:', error);
      logOAuth('error', '❌ PrismaAdapter.createSession failed', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  },
  async getUserByEmail(email: string) {
    try {
      console.log('🔍 PrismaAdapter.getUserByEmail called:', email);
      const result = await baseAdapter.getUserByEmail!(email);
      console.log('✅ PrismaAdapter.getUserByEmail result:', !!result);
      logOAuth('info', '🔍 PrismaAdapter.getUserByEmail', { email, found: !!result });
      return result;
    } catch (error) {
      console.error('❌ PrismaAdapter.getUserByEmail failed:', error);
      logOAuth('error', '❌ PrismaAdapter.getUserByEmail failed', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }
};

export const authOptions: NextAuthOptions = {
  adapter: loggingAdapter,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: true, // Enable debug mode to troubleshoot OAuth issues
  secret: process.env.NEXTAUTH_SECRET,
  providers: finalProviders,
  session: { 
    strategy: "database",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60,  // 24 hours
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
            
            // Only clean up expired sessions, not active ones
            await prisma.session.deleteMany({
              where: { 
                userId: dbUser.id,
                expires: { lt: new Date() } // Only delete actually expired sessions
              }
            });
            console.log('✅ Expired sessions cleaned up during sign-out');
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
        hasAccessToken: !!account?.access_token,
        hasRefreshToken: !!account?.refresh_token,
        providerAccountId: account?.providerAccountId,
        timestamp: new Date().toISOString()
      };
      
      logOAuth('info', '🚀 OAuth signIn callback triggered', signInData);
      console.log('🚀 OAuth signIn callback - allowing PrismaAdapter to handle user/account creation');
      
      // Let PrismaAdapter handle User and Account creation automatically
      // This callback just validates that the sign-in is allowed
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
      // With database strategy, JWT callback just enriches the token
      // PrismaAdapter handles all database operations
      if (user && account) {
        console.log('🔐 JWT callback - user and account present:', {
          userEmail: user.email,
          accountProvider: account.provider
        });
      }
      return token;
    },
  },
};

// Use standard getServerSession since we're using PrismaAdapter now
export const auth = () => getServerSession(authOptions);


