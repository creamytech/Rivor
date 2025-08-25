import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10; // Short duration for status checks

export async function GET(req: NextRequest) {
  try {
    // Skip during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ error: 'Not available during build' }, { status: 503 });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get Calendar sync status (lightweight query)
    const calendarAccount = await prisma.calendarAccount.findFirst({
      where: {
        orgId,
        provider: 'google'
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        provider: true
      }
    });

    if (!calendarAccount) {
      return NextResponse.json({
        connected: false,
        message: 'No Google Calendar account connected'
      });
    }

    // Get event count (cached for performance)
    const eventCount = await prisma.calendarEvent.count({
      where: {
        orgId,
        accountId: calendarAccount.id
      }
    });

    return NextResponse.json({
      connected: calendarAccount.status === 'connected',
      status: calendarAccount.status,
      lastSyncedAt: calendarAccount.updatedAt?.toISOString(),
      provider: calendarAccount.provider,
      eventCount
    });

  } catch (error) {
    console.error('Failed to get Calendar sync status:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      orgId: (session as { orgId?: string })?.orgId || 'unknown',
      userEmail: session?.user?.email || 'unknown'
    });
    
    return NextResponse.json({ 
      error: 'Failed to get sync status',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}