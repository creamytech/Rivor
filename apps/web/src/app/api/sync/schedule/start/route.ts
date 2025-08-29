import { NextRequest, NextResponse } from 'next/server';
import { scheduledSyncService } from '@/server/scheduled-sync-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Endpoint to manually start scheduled sync service
 * Useful for development and testing
 */
export async function POST(req: NextRequest) {
  try {
    // Only allow in development or with special header
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasStartHeader = req.headers.get('X-Start-Sync') === 'allow';
    
    if (!isDevelopment && !hasStartHeader) {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    logger.info('Manual scheduled sync start requested');

    // Start the scheduled sync service
    await scheduledSyncService.startScheduledSync();

    return NextResponse.json({
      success: true,
      message: 'Scheduled sync service started',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to start scheduled sync service', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      error: 'Failed to start scheduled sync service',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check if scheduled sync can be started
 */
export async function GET() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return NextResponse.json({
    available: isDevelopment,
    message: isDevelopment 
      ? 'Scheduled sync can be started manually in development. Use POST to start.'
      : 'Manual start only available in development',
    usage: 'POST /api/sync/schedule/start'
  });
}