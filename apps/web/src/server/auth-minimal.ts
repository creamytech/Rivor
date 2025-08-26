import { prisma } from "./db";
import { type NextAuthOptions, getServerSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

// Minimal NextAuth configuration for debugging session issues
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