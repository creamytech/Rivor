import { prisma } from "./db";
import { enqueueEmailSync } from "./queue";
import { type NextAuthOptions, getServerSession } from "next-auth";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";
import { createKmsClient, generateDek } from "@rivor/crypto";
import { getEnv } from "./env";
import { encryptForOrg } from "./crypto";
import { logger } from "@/lib/logger";

const providers = [] as any[];

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

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  debug: process.env.NEXTAUTH_DEBUG === "true",
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  session: { strategy: "jwt" },
  events: {
    async signIn({ user, account, profile }) {
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
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Always allow sign in - we'll handle org creation in jwt callback
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to app after successful sign in
      console.log('Redirect callback:', { url, baseUrl });
      
      // If the URL is relative or matches our domain, use it
      if (url.startsWith("/") || url.startsWith(baseUrl)) {
        // If it's just the callback URL, redirect to app
        if (url.includes('/api/auth/callback') || url === baseUrl || url === `${baseUrl}/`) {
          console.log('Redirecting to /app');
          return `${baseUrl}/app`;
        }
        return url;
      }
      
      // Default to app
      console.log('Default redirect to /app');
      return `${baseUrl}/app`;
    },
    async session({ session, token }) {
      (session as any).orgId = token.orgId;
      (session as any).user = token.user || {
        email: session.user?.email || '',
        name: session.user?.name || '',
        image: session.user?.image || '',
        provider: 'unknown',
        providerId: ''
      };
      return session;
    },
    async jwt({ token, user, account, profile }) {
      // On first sign in, create org and set orgId
      if (user && account) {
        console.log('JWT callback - first sign in:', { email: user.email, provider: account.provider });
        try {
          // Simple org creation - just use email as org name
          let org = await prisma.org.findFirst({ where: { name: user.email || 'Default' } });
          if (!org) {
            console.log('Creating new org for user:', user.email);
            org = await prisma.org.create({ 
              data: { 
                name: user.email || 'Default',
                encryptedDekBlob: Buffer.from('placeholder'), // Simplified for now
                retentionDays: 365 
              } 
            });
          }
          (token as any).orgId = org.id;
          
          // Sync user profile data from OAuth provider
          if (profile) {
            try {
              const userData = {
                email: user.email || '',
                name: user.name || profile.name || '',
                image: user.image || (profile as any).picture || (profile as any).avatar_url || '',
                provider: account.provider,
                providerId: account.providerAccountId || ''
              };

              // Store user data in the token for session access
              (token as any).user = userData;
              console.log('Synced user profile:', userData);

              // Create OAuth account record for API access if we have tokens
              if (account.access_token) {
                const existingOAuthAccount = await prisma.oAuthAccount.findFirst({
                  where: {
                    userId: user.email || '',
                    provider: account.provider
                  }
                });

                if (!existingOAuthAccount) {
                  await prisma.oAuthAccount.create({
                    data: {
                      userId: user.email || '',
                      provider: account.provider,
                      providerId: account.providerAccountId || '',
                      accessToken: Buffer.from(account.access_token),
                      refreshToken: account.refresh_token ? Buffer.from(account.refresh_token) : Buffer.from(''),
                      scope: account.scope || '',
                      expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null
                    }
                  });
                  console.log('Created OAuth account for API access');
                }
              }
            } catch (profileError) {
              console.error('Error syncing user profile:', profileError);
            }
          }

          console.log('Set orgId:', org.id);
        } catch (error) {
          console.error('Error creating org:', error);
          // Set a default orgId even if db fails
          (token as any).orgId = 'default';
          console.log('Using fallback orgId: default');
        }
      }
      
      // Always ensure we have an orgId
      if (!(token as any).orgId && token.email) {
        console.log('JWT callback - checking existing org for:', token.email);
        try {
          const org = await prisma.org.findFirst({ where: { name: token.email } });
          if (org) {
            (token as any).orgId = org.id;
            console.log('Found existing orgId:', org.id);
          } else {
            (token as any).orgId = 'default';
            console.log('No org found, using default');
          }
        } catch (error) {
          console.error('Error finding org:', error);
          (token as any).orgId = 'default';
        }
      }
      
      return token;
    },
  },
};

// v4 compatibility: provide an auth() helper for server components/routes
export const auth = () => getServerSession(authOptions);


