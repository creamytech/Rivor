import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-pool';
import { getTokenEncryptionStatus } from '@/server/secure-tokens';
import { getEnv } from '@/server/env';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint showing system status
 * Access via /api/health (public) or /admin/health (protected)
 */
export async function GET(_req: NextRequest) {
  // Check if this is an admin request
  const url = new URL(req.url);
  const isAdminRequest = url.pathname.includes('/admin/health');
  
  if (isAdminRequest) {
    // TODO: Add admin authentication check here
    // For now, we'll allow access but you should protect this in production
  }
  const startTime = Date.now();
  
  try {
    const env = getEnv();
    
    // Check database connectivity and schema version
    let dbStatus = 'unknown';
    let dbError: string | null = null;
    let schemaVersion: string | undefined;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'ok';
      
      // Try to get schema version from migrations table
      try {
        const migrations = await prisma.$queryRaw<Array<{migration_name: string}>>`
          SELECT migration_name FROM "_prisma_migrations" 
          ORDER BY finished_at DESC 
          LIMIT 1
        `;
        if (migrations.length > 0) {
          schemaVersion = migrations[0].migration_name.slice(0, 14); // First 14 chars are timestamp
        }
      } catch {
        schemaVersion = 'unknown';
      }
    } catch (error: unknown) {
      dbStatus = 'error';
      dbError = error.message;
    }
    
    // Check Redis connectivity (optional)
    let redisStatus = 'not_configured';
    const redisError: string | null = null;
    if (env.REDIS_URL) {
      // Redis is optional, so we just mark it as configured
      redisStatus = 'configured';
    }
    
    // Get account sync status summary
    const accountStats = await prisma.emailAccount.groupBy({
      by: ['syncStatus', 'status', 'encryptionStatus'],
      _count: { id: true }
    });
    
    // Get Pub/Sub status
    const pubsubConfigured = !!(env.GOOGLE_PUBSUB_TOPIC && env.GOOGLE_PUBSUB_VERIFICATION_TOKEN);
    
    // Get last push notification received
    let lastPushReceived: Date | null = null;
    try {
      const lastPush = await prisma.pushNotificationLog.findFirst({
        where: { success: true },
        orderBy: { processedAt: 'desc' },
        select: { processedAt: true }
      });
      lastPushReceived = lastPush?.processedAt || null;
    } catch (error) {
      // Non-critical failure
    }
    
    // Get recent errors from audit log
    const recentErrors = await prisma.auditLog.findMany({
      where: {
        success: false,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        action: true,
        resource: true,
        createdAt: true,
        orgId: true
      }
    });
    
    // Get KMS status
    const kmsEnabled = !!(env.KMS_PROVIDER && env.KMS_KEY_ID);
    
    // Check token encryption health across all orgs
    const tokenHealth = await getTokenEncryptionHealthSummary();
    
    const health = {
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
      schemaVersion,
      
      // Core infrastructure
      database: {
        status: dbStatus,
        error: dbError,
        url_host: env.DATABASE_URL ? new URL(env.DATABASE_URL).hostname : 'not_configured'
      },
      
      redis: {
        status: redisStatus,
        error: redisError,
        configured: !!env.REDIS_URL
      },
      
      // KMS and encryption
      encryption: {
        kms_enabled: kmsEnabled,
        kms_provider: env.KMS_PROVIDER || null,
        token_health: tokenHealth
      },
      
      // OAuth and sync status
      accounts: {
        total: accountStats.reduce((sum, stat) => sum + stat._count.id, 0),
        by_sync_status: accountStats.reduce((acc, stat) => {
          acc[stat.syncStatus] = (acc[stat.syncStatus] || 0) + stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        by_connection_status: accountStats.reduce((acc, stat) => {
          acc[stat.status] = (acc[stat.status] || 0) + stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        by_encryption_status: accountStats.reduce((acc, stat) => {
          acc[stat.encryptionStatus] = (acc[stat.encryptionStatus] || 0) + stat._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      
      // Real-time sync
      pubsub: {
        configured: pubsubConfigured,
        topic: env.GOOGLE_PUBSUB_TOPIC || null,
        verification_token_set: !!env.GOOGLE_PUBSUB_VERIFICATION_TOKEN,
        last_push_received: lastPushReceived
      },
      
      // Recent issues
      recent_errors: recentErrors,
      
      // Performance
      response_time_ms: Date.now() - startTime
    };
    
    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503
    });
    
  } catch (error: unknown) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      response_time_ms: Date.now() - startTime
    }, {
      status: 500
    });
  }
}

/**
 * Get token encryption health summary across all organizations
 */
async function getTokenEncryptionHealthSummary() {
  try {
    const tokenStats = await prisma.secureToken.groupBy({
      by: ['encryptionStatus'],
      _count: { id: true }
    });
    
    const oldestFailure = await prisma.secureToken.findFirst({
      where: { encryptionStatus: 'failed' },
      orderBy: { kmsErrorAt: 'asc' },
      select: { kmsErrorAt: true }
    });
    
    return {
      total_tokens: tokenStats.reduce((sum, stat) => sum + stat._count.id, 0),
      ok_tokens: tokenStats.find(s => s.encryptionStatus === 'ok')?._count.id || 0,
      pending_tokens: tokenStats.find(s => s.encryptionStatus === 'pending')?._count.id || 0,
      failed_tokens: tokenStats.find(s => s.encryptionStatus === 'failed')?._count.id || 0,
      oldest_failure: oldestFailure?.kmsErrorAt || null
    };
  } catch (error) {
    return {
      error: 'Could not fetch token health',
      message: (error as unknown)?.message || error
    };
  }
}
