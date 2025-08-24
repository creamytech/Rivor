import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/server/db';
import { logOAuth } from '@/lib/oauth-logger';

export async function GET(req: NextRequest) {
  try {
    logOAuth('info', '🍪 Checking session cookies and tokens');
    
    // Get cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('__Secure-next-auth.session-token')?.value || 
                        cookieStore.get('next-auth.session-token')?.value;
    
    const allCookies = Array.from(cookieStore.entries()).map(([name, cookie]) => ({
      name,
      value: cookie.value.substring(0, 20) + '...',
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite
    }));

    logOAuth('info', '🍪 Cookie analysis', {
      sessionTokenFound: !!sessionToken,
      sessionTokenPreview: sessionToken ? sessionToken.substring(0, 20) + '...' : null,
      totalCookies: allCookies.length,
      authCookies: allCookies.filter(c => c.name.includes('auth'))
    });

    // If we have a session token, check if it exists in database
    let dbSessionInfo = null;
    if (sessionToken) {
      const dbSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      dbSessionInfo = {
        found: !!dbSession,
        expired: dbSession ? dbSession.expires < new Date() : null,
        userId: dbSession?.userId || null,
        userEmail: dbSession?.user?.email || null,
        expires: dbSession?.expires || null,
        created: dbSession?.createdAt || null
      };
    }

    return NextResponse.json({
      success: true,
      cookies: {
        sessionTokenFound: !!sessionToken,
        sessionTokenPreview: sessionToken ? sessionToken.substring(0, 20) + '...' : null,
        authCookies: allCookies.filter(c => c.name.includes('auth')),
        allCookieNames: allCookies.map(c => c.name)
      },
      database: dbSessionInfo,
      diagnosis: {
        hasSessionCookie: !!sessionToken,
        sessionInDatabase: dbSessionInfo?.found || false,
        sessionExpired: dbSessionInfo?.expired || false,
        cookieDbMatch: !!sessionToken && !!dbSessionInfo?.found,
        possibleIssue: !sessionToken ? 'No session cookie found' :
                      !dbSessionInfo?.found ? 'Session token not in database' :
                      dbSessionInfo?.expired ? 'Session expired' :
                      'Session should be working'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logOAuth('error', '❌ Session token check failed', { 
      error: error instanceof Error ? error.message : error 
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}