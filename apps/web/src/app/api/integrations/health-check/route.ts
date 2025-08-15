import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { runOrgHealthProbes } from '@/server/health-probes';
import { logger } from '@/lib/logger';

// Force dynamic rendering - this route uses session/auth data
export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  const correlationId = `manual-health-check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const orgId = (session as unknown).orgId;

    if (!orgId || orgId === 'unknown') {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }

    logger.info('Manual health check initiated', {
      userEmail,
      orgId,
      correlationId,
      action: 'manual_health_check_start'
    });

    // Parse request body for options
    let force = false;
    try {
      const body = await req.json();
      force = body?.force || false;
    } catch {
      // Body parsing failed, use defaults
    }

    // Run comprehensive health check
    const startTime = Date.now();
    
    // Run health probes for all accounts in the org
    const probeResults = await runOrgHealthProbes(orgId);
    
    const latency = Date.now() - startTime;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      latency,
      correlationId,
      results: {
        probes: probeResults,
        summary: {
          totalAccounts: probeResults.length,
          healthyAccounts: probeResults.filter(r => r.overallStatus === 'connected').length,
          accountsNeedingAttention: probeResults.filter(r => r.overallStatus === 'action_needed').length,
          overallHealthy: probeResults.some(r => r.overallStatus === 'connected')
        }
      }
    };

    logger.info('Manual health check completed', {
      userEmail,
      orgId,
      correlationId,
      latency,
      totalAccounts: response.results.summary.totalAccounts,
      healthyAccounts: response.results.summary.healthyAccounts,
      overallHealthy: response.results.summary.overallHealthy,
      action: 'manual_health_check_complete'
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Manual health check failed', {
      correlationId,
      error: error.message,
      action: 'manual_health_check_failed'
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Health check failed',
        correlationId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const orgId = (session as unknown).orgId;

    if (!orgId || orgId === 'unknown') {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }

    // Get integration status
    const response = await fetch(`${req.nextUrl.origin}/api/integrations/status`, {
      headers: {
        'Cookie': req.headers.get('Cookie') || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get integration status');
    }

    const integrationStatus = await response.json();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: integrationStatus.overallStatus,
      accounts: integrationStatus.emailAccounts,
      summary: integrationStatus.summary
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to get health status',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
