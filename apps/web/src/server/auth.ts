import { prisma } from "./db";
import { enqueueEmailSync } from "./queue";
import { type NextAuthOptions, getServerSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";
import { createKmsClient, generateDek } from "@rivor/crypto";
import { getEnv } from "./env";
import { encryptForOrg } from "./crypto";
import { logger } from "@/lib/logger";
import { handleOAuthCallback, isDuplicateCallback, type OAuthCallbackData } from "./onboarding";
import { validateAndLogStartupConfig } from "./env";

const providers = [] as unknown[];

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

// Google OAuth (enabled if configured)
const REQUIRED_GOOGLE_SCOPES = "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly";
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

// Only Google and Microsoft providers are supported
if (providers.length === 0) {
  console.warn("No OAuth providers configured. Please set up Google or Microsoft OAuth credentials.");
}

// Validate startup configuration on module load
validateAndLogStartupConfig();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NEXTAUTH_DEBUG === "true",
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  session: { 
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60,   // 1 hour - refresh session
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
      
      // Optionally try to set up additional resources in background
      // but don't block the authentication flow
      if (account?.provider && user.email) {
        logger.info('Setting up resources for user', {
          userId: user.email,
          action: 'setup_resources',
          metadata: { provider: account.provider }
        });
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
      console.log('🚀 OAuth signIn callback start', {
        provider: account?.provider,
        userEmail: user.email,
        timestamp: new Date().toISOString()
      });
      
      // NextAuth should create User and Account records automatically with database strategy
      // This callback just validates the sign-in is allowed
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Enhanced redirect logic for deep links and user flow
      console.log('Redirect callback:', { url, baseUrl });
      
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
      // On sign in (including re-auth), use robust onboarding flow
      if (user && account) {
        try {
          // Check for duplicate callback (idempotency)
          const externalAccountId = account.providerAccountId || (profile as unknown)?.sub || (profile as unknown)?.id || 'unknown';
          const isDuplicate = await isDuplicateCallback(
            user.email || user.id,
            account.provider,
            externalAccountId
          );

          if (isDuplicate) {
            logger.info('Duplicate OAuth callback detected, skipping onboarding', {
              userId: user.email || '',
              provider: account.provider,
              externalAccountId,
            });
          } else {
            // Prepare onboarding data
            const onboardingData: OAuthCallbackData = {
              userId: user.email || user.id,
              userEmail: user.email || '',
              userName: user.name || profile?.name || '',
              userImage: user.image || (profile as unknown)?.picture || '',
              provider: account.provider,
              externalAccountId,
              account,
              profile,
            };

            // Execute robust onboarding
            const result = await handleOAuthCallback(onboardingData);

            // Store results in token
            (token as unknown).orgId = result.orgId;
            (token as unknown).isFirstTime = result.isFirstTimeUser;
            (token as unknown).requiresTokenRetry = result.requiresTokenRetry;

            // Store user data for session access
            (token as unknown).user = {
              email: onboardingData.userEmail,
              name: onboardingData.userName,
              image: onboardingData.userImage,
              provider: account.provider,
              providerId: externalAccountId,
            };

            if (!result.success) {
              logger.error('Onboarding failed but continuing with auth', {
                userId: user.email || '',
                provider: account.provider,
                errors: result.errors,
              });
            }
          }

          // Always find and set orgId if not set
          if (!(token as unknown).orgId) {
            const org = await prisma.org.findFirst({ 
              where: { name: user.email || 'default' } 
            });
            (token as unknown).orgId = org?.id || 'default';
          }

        } catch (error: unknown) {
          logger.error('OAuth callback processing failed', {
            userId: user.email || '',
            provider: account.provider,
            error: error?.message || error,
          });
          
          // Fallback behavior - continue auth but set defaults
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
      
      // Always ensure we have an orgId
      if (!(token as unknown).orgId && token.email) {
        console.log('JWT callback - checking existing org for:', token.email);
        try {
          const org = await prisma.org.findFirst({ where: { name: token.email } });
          if (org) {
            (token as unknown).orgId = org.id;
            console.log('Found existing orgId:', org.id);
          } else {
            (token as unknown).orgId = 'default';
            console.log('No org found, using default');
          }
        } catch (error) {
          console.error('Error finding org:', error);
          (token as unknown).orgId = 'default';
        }
      }
      
      return token;
    },
  },
};

// v4 compatibility: provide an auth() helper for server components/routes
export const auth = () => getServerSession(authOptions);


