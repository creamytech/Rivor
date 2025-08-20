import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function GET(__request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const orgId = (session as { orgId?: string }).orgId;

    if (!orgId || orgId === 'unknown') {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // Get user to find correct userId
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get EmailAccount for this user
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        orgId,
        userId: user.id,
        provider: 'google'
      }
    });

    return NextResponse.json({
      success: true,
      userEmail,
      orgId,
      userId: user.id,
      emailAccount: emailAccount ? {
        id: emailAccount.id,
        provider: emailAccount.provider,
        email: emailAccount.email,
        status: emailAccount.status,
        syncStatus: emailAccount.syncStatus
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to test simple endpoint", 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
