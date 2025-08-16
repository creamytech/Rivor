import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(__request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    logger.info('Old sync endpoint called', {
      userEmail: session.user.email,
      timestamp: new Date().toISOString(),
      userAgent: __request.headers.get('user-agent'),
      referer: __request.headers.get('referer')
    });

    return NextResponse.json({
      success: true,
      message: 'Old sync endpoint called - this should not happen',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Old sync endpoint error', { error: error.message });
    return NextResponse.json({ error: "Old sync endpoint error", details: error.message }, { status: 500 });
  }
}
