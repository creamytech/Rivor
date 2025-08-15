import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { checkTokenHealth } from "@/server/oauth-fixed";

// Force dynamic rendering - this route uses session/auth data
export const dynamic = 'force-dynamic';

export async function GET(__request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Get user to find correct userId
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check OAuth accounts using correct User.id
    const oauthAccounts = await prisma.oAuthAccount.findMany({
      where: { userId: user.id }, // Use User.id instead of email
      select: {
        id: true,
        provider: true,
        scope: true,
        expiresAt: true,
        updatedAt: true,
        createdAt: true
      }
    });

    // Check token health
    const tokenHealth = await checkTokenHealth(userEmail);

    // Check email and calendar accounts
    const org = await prisma.org.findFirst({ where: { name: userEmail } });
    let emailAccounts: Array<{ id: string; provider: string; status: string; createdAt: Date }> = [];
    let calendarAccounts: Array<{ id: string; provider: string; status: string; createdAt: Date }> = [];
    
    if (org) {
      emailAccounts = await prisma.emailAccount.findMany({
        where: { orgId: org.id },
        select: { id: true, provider: true, status: true, createdAt: true }
      });
      
      calendarAccounts = await prisma.calendarAccount.findMany({
        where: { orgId: org.id },
        select: { id: true, provider: true, status: true, createdAt: true }
      });
    }

    return NextResponse.json({
      userEmail,
      session: {
        user: session.user,
        orgId: (session as { orgId?: string }).orgId
      },
      oauthAccounts,
      tokenHealth,
      emailAccounts,
      calendarAccounts,
      org: org ? { id: org.id, name: org.name } : null
    });

  } catch (error) {
    console.error("Debug OAuth error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
