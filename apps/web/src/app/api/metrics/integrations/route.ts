import { NextRequest, NextResponse } from 'next/server';
import { getMetricsForApi } from '@/server/monitoring';
import { auth } from '@/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Check authentication - only allow admin users or system monitoring
    const session = await auth();
    const apiKey = req.headers.get('x-api-key');
    
    // Allow access via API key (for external monitoring) or admin session
    if (!apiKey && (!(session as any)?.orgId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // If using API key, validate it
    if (apiKey && apiKey !== process.env.METRICS_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Collect and return metrics
    const metrics = await getMetricsForApi();

    return NextResponse.json({
      success: true,
      data: metrics,
    });

  } catch (error: any) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error?.message || error
      },
      { status: 500 }
    );
  }
}
