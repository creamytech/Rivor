import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { checkTokenHealth } from "@/server/oauth";

// Force dynamic rendering - this route uses session/auth data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Check OAuth accounts
    const oauthAccounts = await prisma.oAuthAccount.findMany({
      where: { userId: userEmail },
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
    let emailAccounts: any[] = [];
    let calendarAccounts: any[] = [];
    
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
        orgId: (session as any).orgId
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
