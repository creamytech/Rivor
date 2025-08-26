import { prisma } from "./db";
import { type NextAuthOptions, getServerSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

// Minimal NextAuth configuration with essential onboarding
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
        },
      },
    })
  ],
  session: { 
    strategy: "database",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user, account, profile }) {
      console.log('🔗 linkAccount event - triggering onboarding for:', user.email);
      
      if (user.email && account) {
        try {
          // Import onboarding function
          const { handleOAuthCallback } = await import("./onboarding");
          
          // Trigger onboarding to create org and email accounts
          const onboardingResult = await handleOAuthCallback({
            userId: user.id,
            userEmail: user.email,
            userName: user.name || undefined,
            userImage: user.image || undefined,
            provider: account.provider,
            externalAccountId: account.providerAccountId,
            account,
            profile
          });
          
          console.log('✅ Onboarding completed:', {
            success: onboardingResult.success,
            orgId: onboardingResult.orgId,
            hasEmailAccount: !!onboardingResult.emailAccountId,
            hasCalendarAccount: !!onboardingResult.calendarAccountId
          });
          
        } catch (error) {
          console.error('❌ Onboarding failed:', error);
        }
      }
    },
  },
};

export const auth = async () => {
  try {
    console.log('🔍 Minimal auth() called');
    const session = await getServerSession(authOptions);
    console.log('🔍 Minimal getServerSession result:', !!session);
    return session;
  } catch (error) {
    console.error('❌ Minimal auth() failed:', error);
    return null;
  }
};