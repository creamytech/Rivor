import { prisma } from "./db";
import { enqueueEmailSync } from "./queue";
import { type NextAuthOptions, getServerSession } from "next-auth";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";
import { createKmsClient, generateDek } from "@rivor/crypto";
import { getEnv } from "./env";
import { encryptForOrg } from "./crypto";

const providers = [] as any[];

// Microsoft OAuth (always enabled if configured)
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  providers.push(AzureAD({
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    tenantId: process.env.MICROSOFT_TENANT_ID ?? "common",
    authorization: { 
      params: { 
        scope: process.env.MICROSOFT_OAUTH_SCOPES || "openid email profile https://graph.microsoft.com/mail.read" 
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

// Add a demo provider if no real providers are configured (for testing)
if (providers.length === 0 && process.env.NODE_ENV !== "production") {
  console.warn("No OAuth providers configured. Adding demo provider for development.");
  providers.push({
    id: "demo",
    name: "Demo Login",
    type: "oauth",
    authorization: "https://example.com/oauth/authorize",
    token: "https://example.com/oauth/token",
    userinfo: "https://example.com/oauth/userinfo",
    clientId: "demo",
    clientSecret: "demo",
    profile(profile: any) {
      return {
        id: "demo-user",
        name: "Demo User",
        email: "demo@example.com",
      }
    },
  });
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
      try {
        // Find or create Org (placeholder: per-user org)
        let org = await prisma.org.findFirst({ where: { name: user.email || 'Org' } });
        if (!org) {
          // Generate per-org DEK and wrap with KMS
          const env = getEnv();
          const kms = createKmsClient(env.KMS_PROVIDER, env.KMS_KEY_ID);
          const dek = generateDek();
          const wrapped = await kms.encryptDek(dek);
          org = await prisma.org.create({ data: { name: user.email || 'Org', encryptedDekBlob: Buffer.from(wrapped), retentionDays: env.RETENTION_DAYS } });
        }
        // Ensure OrgMember
        await prisma.orgMember.upsert({
          where: { orgId_userId: { orgId: org.id, userId: user.id || user.email! } },
          update: {},
          create: { orgId: org.id, userId: user.id || user.email!, role: 'member' },
        });
        // Persist EmailAccount and encrypted OAuth tokens
        if (account?.provider) {
          await prisma.emailAccount.upsert({
            where: { id: `${org.id}:${account.provider}:${user.email}` },
            update: { status: 'connected' },
            create: { id: `${org.id}:${account.provider}:${user.email}`, orgId: org.id, provider: account.provider, status: 'connected' },
          });
          if (account.providerAccountId) {
            const accessBlob = account.access_token ? await encryptForOrg(org.id, account.access_token, 'oauth:access') : Buffer.from('');
            const refreshBlob = account.refresh_token ? await encryptForOrg(org.id, account.refresh_token, 'oauth:refresh') : Buffer.from('');
            await prisma.oAuthAccount.upsert({
              where: { provider_providerId: { provider: account.provider, providerId: account.providerAccountId } },
              update: {
                userId: user.id || user.email!,
                accessToken: accessBlob,
                refreshToken: refreshBlob,
                scope: account.scope ?? null,
                expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
              },
              create: {
                userId: user.id || user.email!,
                provider: account.provider,
                providerId: account.providerAccountId,
                accessToken: accessBlob,
                refreshToken: refreshBlob,
                scope: account.scope ?? null,
                expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
              },
            });
          }
          await enqueueEmailSync(org.id, `${org.id}:${account.provider}:${user.email}`);
        }
      } catch (err) {
        console.warn('[auth.events.signIn] failed', err);
      }
    },
  },
  callbacks: {
    async session({ session, token }) {
      (session as any).orgId = token.orgId;
      return session;
    },
    async jwt({ token }) {
      if (!(token as any).orgId && token.email) {
        try {
          const org = await prisma.org.findFirst({ where: { name: token.email } });
          if (org) (token as any).orgId = org.id;
        } catch {}
      }
      return token;
    },
  },
};

// v4 compatibility: provide an auth() helper for server components/routes
export const auth = () => getServerSession(authOptions);


