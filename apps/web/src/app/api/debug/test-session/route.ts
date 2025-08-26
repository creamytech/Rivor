import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logOAuth } from '@/lib/oauth-logger';

export async function GET(req: NextRequest) {
  try {
    logOAuth('info', '🧪 Testing session retrieval');
    
    // Test server-side session retrieval
    const session = await auth();
    
    // Check current sessions in database
    const dbSessions = await prisma.session.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    // Check cookies
    const cookies = req.headers.get('cookie') || '';
    const sessionToken = cookies
      .split(';')
      .find(cookie => cookie.trim().startsWith('__Secure-next-auth.session-token=') || cookie.trim().startsWith('next-auth.session-token='))
      ?.split('=')[1];
    
    const result = {
      serverSession: {
        found: !!session,
        user: session?.user ? {
          email: session.user.email,
          name: session.user.name
        } : null
      },
      sessionCookie: {
        found: !!sessionToken,
        preview: sessionToken ? sessionToken.substring(0, 20) + '...' : null
      },
      databaseSessions: dbSessions.map(s => ({
        id: s.id,
        userId: s.userId,
        userEmail: s.user.email,
        expires: s.expires,
        tokenPreview: s.sessionToken.substring(0, 20) + '...',
        createdAt: s.createdAt
      })),
      analysis: {
        hasServerSession: !!session,
        hasSessionCookie: !!sessionToken,
        dbSessionsCount: dbSessions.length,
        cookieMatchesDb: dbSessions.some(s => s.sessionToken === sessionToken),
        recommendation: !session && dbSessions.length > 0 ? 'Session exists in DB but not retrieved by auth()' : 
                      !session && !sessionToken ? 'No session cookie found' :
                      session ? 'Session working correctly' : 'Unknown issue'
      }
    };
    
    logOAuth('info', '🧪 Session test results', result.analysis);
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logOAuth('error', '❌ Session test failed', { 
      error: error instanceof Error ? error.message : error 
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}