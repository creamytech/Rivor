import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10; // Short duration for status checks

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get Gmail sync status (lightweight query)
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        orgId,
        provider: 'google'
      },
      select: {
        id: true,
        status: true,
        lastSyncedAt: true,
        email: true
      }
    });

    if (!emailAccount) {
      return NextResponse.json({
        connected: false,
        message: 'No Gmail account connected'
      });
    }

    return NextResponse.json({
      connected: emailAccount.status === 'connected',
      status: emailAccount.status,
      lastSyncedAt: emailAccount.lastSyncedAt?.toISOString(),
      email: emailAccount.email
    });

  } catch (error) {
    console.error('Failed to get Gmail sync status:', error);
    return NextResponse.json({ 
      error: 'Failed to get sync status' 
    }, { status: 500 });
  }
}