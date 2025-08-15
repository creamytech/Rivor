import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { probeAllGoogleServices, clearProbeCache } from '@/server/health-probes';
import { checkTokenHealth } from '@/server/oauth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
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
    const orgId = (session as any).orgId;

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

    // Clear cache if force refresh requested
    if (force) {
      clearProbeCache(orgId);
    }

    // Run comprehensive health check
    const startTime = Date.now();
    
    // Run Google service probes
    const probeResults = await probeAllGoogleServices(orgId, force);
    
    // Get updated token health with fresh probe results
    const tokenHealth = await checkTokenHealth(userEmail, false);
    
    const latency = Date.now() - startTime;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      latency,
      correlationId,
      results: {
        probes: probeResults,
        tokenHealth: tokenHealth.filter(t => t.provider === 'google'),
        summary: {
          gmailHealthy: probeResults.gmail.success,
          calendarHealthy: probeResults.calendar.success,
          tokensValid: tokenHealth.some(t => t.provider === 'google' && t.connected),
          overallHealthy: probeResults.gmail.success || probeResults.calendar.success
        }
      }
    };

    logger.info('Manual health check completed', {
      userEmail,
      orgId,
      correlationId,
      latency,
      gmailSuccess: probeResults.gmail.success,
      calendarSuccess: probeResults.calendar.success,
      tokensValid: response.results.summary.tokensValid,
      action: 'manual_health_check_complete'
    });

    return NextResponse.json(response);
  } catch (error: any) {
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
    const orgId = (session as any).orgId;

    if (!orgId || orgId === 'unknown') {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }

    // Get current token health (using cached probe results)
    const tokenHealth = await checkTokenHealth(userEmail, true); // Skip validation for GET
    
    const googleHealth = tokenHealth.find(t => t.provider === 'google');
    
    const response = {
      timestamp: new Date().toISOString(),
      status: googleHealth ? (googleHealth.connected ? 'healthy' : 'unhealthy') : 'not_configured',
      provider: 'google',
      services: googleHealth?.services || { gmail: null, calendar: null },
      lastProbeSuccess: googleHealth?.lastProbeSuccess,
      lastProbeError: googleHealth?.lastProbeError,
      scopes: googleHealth?.scopes || [],
      tokenValidation: googleHealth?.tokenValidation
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to get health status',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
