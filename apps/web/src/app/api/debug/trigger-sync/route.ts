import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { enqueueEmailSync } from '@/server/queue';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(__request: NextRequest) {
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

    if (!emailAccount) {
      return NextResponse.json({ error: "EmailAccount not found" }, { status: 404 });
    }

    // Check if SecureToken exists
    const secureToken = await prisma.secureToken.findFirst({
      where: { 
        orgId,
        provider: 'google',
        tokenType: 'oauth_access'
      }
    });

    if (!secureToken) {
      return NextResponse.json({ error: "SecureToken not found" }, { status: 404 });
    }

    // Manually trigger email sync
    logger.info('Manually triggering email sync', {
      userEmail,
      orgId,
      emailAccountId: emailAccount.id,
      secureTokenId: secureToken.id
    });

    await enqueueEmailSync(orgId, emailAccount.id);

    // Update sync status
    await prisma.emailAccount.update({
      where: { id: emailAccount.id },
      data: { 
        syncStatus: 'scheduled',
        lastSyncedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Email sync triggered successfully',
      emailAccountId: emailAccount.id,
      orgId,
      syncStatus: 'scheduled',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Failed to trigger email sync', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: "Failed to trigger email sync", details: error.message }, { status: 500 });
  }
}
