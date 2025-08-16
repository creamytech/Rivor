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

    // Log detailed information about the request
    logger.info('Old sync endpoint called - CACHE BUSTED VERSION', {
      userEmail: session.user.email,
      timestamp: new Date().toISOString(),
      userAgent: __request.headers.get('user-agent'),
      referer: __request.headers.get('referer'),
      url: __request.url,
      method: __request.method,
      headers: Object.fromEntries(__request.headers.entries())
    });

    // Return response with cache-busting headers
    const response = NextResponse.json({
      success: true,
      message: 'CACHE BUSTED: Old sync endpoint called - this should not happen',
      timestamp: new Date().toISOString(),
      version: 'cache-busted-v2'
    });

    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error: any) {
    logger.error('Old sync endpoint error', { error: error.message });
    return NextResponse.json({ error: "Old sync endpoint error", details: error.message }, { status: 500 });
  }
}
