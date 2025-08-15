import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';

export const dynamic = 'force-dynamic';

/**
 * Report client-side errors for monitoring
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const {
      errorId,
      message,
      stack,
      componentStack,
      timestamp,
      userAgent,
      url
    } = body;

    // Log structured error for monitoring
    const errorReport = {
      errorId,
      message,
      stack,
      componentStack,
      timestamp,
      userAgent,
      url,
      userId: session?.user?.email || 'anonymous',
      orgId: (session as unknown)?.orgId || null,
      severity: 'error',
      source: 'client',
      correlationId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // In a production environment, you would send this to your monitoring service:
    // - Sentry
    // - Datadog
    // - New Relic
    // - Custom logging service
    
    console.error('Client Error Report:', JSON.stringify(errorReport, null, 2));

    // Store in database for audit trail (optional)
    // await prisma.errorLog.create({
    //   data: {
    //     errorId,
    //     message,
    //     stack,
    //     userId: session?.user?.email,
    //     orgId: (session as unknown)?.orgId,
    //     url,
    //     userAgent,
    //     severity: 'error',
    //     source: 'client'
    //   }
    // });

    return NextResponse.json({ 
      success: true, 
      errorId,
      message: 'Error report received and logged'
    });

  } catch (error: unknown) {
    console.error('Error reporting API error:', error);
    
    // Even if error reporting fails, we should respond gracefully
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process error report',
        message: 'Error logging service is currently unavailable'
      },
      { status: 500 }
    );
  }
}
