import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { scheduledSyncService } from '@/server/scheduled-sync-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint to verify scheduled sync functionality
 * This endpoint helps ensure the automatic background syncing works properly
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ 
        error: 'No organization found' 
      }, { status: 400 });
    }

    // Get current sync status
    const syncStatus = await scheduledSyncService.getSyncStatus(orgId);

    logger.info('Scheduled sync test requested', {
      orgId,
      userEmail: session.user.email,
      currentStatus: syncStatus
    });

    return NextResponse.json({
      success: true,
      orgId,
      scheduledSyncStatus: syncStatus,
      systemInfo: {
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        message: syncStatus.scheduled 
          ? 'Scheduled sync is active and will run automatically every few hours'
          : 'Scheduled sync is not active - it will start automatically when the server initializes'
      }
    });

  } catch (error) {
    logger.error('Scheduled sync test failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to test scheduled sync',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Force start scheduled sync for testing (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ 
        error: 'No organization found' 
      }, { status: 400 });
    }

    // Force start scheduled sync for this org
    await scheduledSyncService.startOrgSync(orgId);
    
    // Get updated status
    const syncStatus = await scheduledSyncService.getSyncStatus(orgId);

    logger.info('Forced scheduled sync start', {
      orgId,
      userEmail: session.user.email,
      newStatus: syncStatus
    });

    return NextResponse.json({
      success: true,
      message: 'Scheduled sync force started',
      orgId,
      scheduledSyncStatus: syncStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to force start scheduled sync', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to start scheduled sync',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}