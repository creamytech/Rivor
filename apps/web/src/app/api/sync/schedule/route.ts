import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { scheduledSyncService } from '@/server/scheduled-sync-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET - Get scheduled sync status
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

    const syncStatus = await scheduledSyncService.getSyncStatus(orgId);

    return NextResponse.json({
      success: true,
      orgId,
      scheduledSync: syncStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get scheduled sync status', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to get sync status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST - Control scheduled sync (start/stop/restart)
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

    const body = await request.json();
    const { action, config } = body;

    let result;
    switch (action) {
      case 'start':
        await scheduledSyncService.startOrgSync(orgId);
        result = { message: 'Scheduled sync started' };
        break;

      case 'stop':
        await scheduledSyncService.stopOrgSync(orgId);
        result = { message: 'Scheduled sync stopped' };
        break;

      case 'restart':
        await scheduledSyncService.stopOrgSync(orgId);
        await scheduledSyncService.startOrgSync(orgId);
        result = { message: 'Scheduled sync restarted' };
        break;

      case 'update_config':
        if (config) {
          await scheduledSyncService.updateSyncConfig(orgId, config);
          result = { message: 'Sync configuration updated' };
        } else {
          return NextResponse.json({ 
            error: 'Config required for update_config action' 
          }, { status: 400 });
        }
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use: start, stop, restart, or update_config' 
        }, { status: 400 });
    }

    // Get updated status
    const syncStatus = await scheduledSyncService.getSyncStatus(orgId);

    logger.info('Scheduled sync control action completed', {
      orgId,
      action,
      userEmail: session.user.email,
      result
    });

    return NextResponse.json({
      success: true,
      action,
      result,
      scheduledSync: syncStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Scheduled sync control failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      success: false,
      error: 'Scheduled sync control failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}