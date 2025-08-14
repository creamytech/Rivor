import { prisma } from "./db";
import { enqueueEmailSync } from "./queue";import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { access_type: "offline", prompt: "consent" } },
    }),
    AzureAD({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID ?? "common",
    }),
  ],
    session: { strategy: "jwt" },
  events: {
    async signIn({ user, account, profile }) {
      try {
        // Find or create Org (placeholder: per-user org)
        let org = await prisma.org.findFirst({ where: { name: user.email || 'Org' } });
        if (!org) {
          org = await prisma.org.create({ data: { name: user.email || 'Org', encryptedDekBlob: Buffer.from(''), retentionDays: 90 } });
        }
        // Ensure OrgMember
        await prisma.orgMember.upsert({
          where: { orgId_userId: { orgId: org.id, userId: user.id || user.email! } },
          update: {},
          create: { orgId: org.id, userId: user.id || user.email!, role: 'member' },
        });
        // Persist EmailAccount
        if (account?.provider) {
          await prisma.emailAccount.upsert({
            where: { id: `${org.id}:${account.provider}:${user.email}` },
            update: { status: 'connected' },
            create: { id: `${org.id}:${account.provider}:${user.email}`, orgId: org.id, provider: account.provider, status: 'connected' },
          });
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
    async jwt({ token, account, profile }) {\n      // If first time sign-in, attach or create org and member\n      // TODO: look up existing org by domain or invite; for now, create per-user org\n      if (!(token as any).orgId) { (token as any).orgId = (profile as any)?.hd ?? null; }\n      return token;\n    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);


