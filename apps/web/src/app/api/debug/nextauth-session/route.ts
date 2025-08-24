import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authOptions } from '@/server/auth';
import { getServerSession } from 'next-auth';
import { logOAuth } from '@/lib/oauth-logger';

export async function GET(req: NextRequest) {
  try {
    logOAuth('info', '🔍 Testing NextAuth session behavior');
    
    // Get cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('__Secure-next-auth.session-token')?.value || 
                        cookieStore.get('next-auth.session-token')?.value;

    // Try different session retrieval methods
    const results = {
      sessionToken: {
        found: !!sessionToken,
        preview: sessionToken ? sessionToken.substring(0, 20) + '...' : null
      },
      getServerSession: null,
      authFunction: null,
      customAdapterTest: null
    };

    // 1. Try getServerSession directly
    try {
      const session1 = await getServerSession(authOptions);
      results.getServerSession = {
        found: !!session1,
        user: session1?.user || null,
        expires: session1?.expires || null
      };
      logOAuth('info', '✅ getServerSession result', results.getServerSession);
    } catch (error) {
      results.getServerSession = { error: error instanceof Error ? error.message : error };
      logOAuth('error', '❌ getServerSession failed', results.getServerSession);
    }

    // 2. Try our auth() function  
    try {
      const { auth } = await import('@/server/auth');
      const session2 = await auth();
      results.authFunction = {
        found: !!session2,
        user: session2?.user || null,
        expires: session2?.expires || null
      };
      logOAuth('info', '✅ auth() result', results.authFunction);
    } catch (error) {
      results.authFunction = { error: error instanceof Error ? error.message : error };
      logOAuth('error', '❌ auth() failed', results.authFunction);
    }

    // 3. Test custom adapter directly
    if (sessionToken) {
      try {
        const { createCustomPrismaAdapter } = await import('@/server/auth-adapter');
        const adapter = createCustomPrismaAdapter();
        
        if (adapter.getSessionAndUser) {
          const sessionAndUser = await adapter.getSessionAndUser(sessionToken);
          results.customAdapterTest = {
            found: !!sessionAndUser,
            hasSession: !!sessionAndUser?.session,
            hasUser: !!sessionAndUser?.user,
            userEmail: sessionAndUser?.user?.email || null
          };
          logOAuth('info', '✅ Custom adapter direct test', results.customAdapterTest);
        }
      } catch (error) {
        results.customAdapterTest = { error: error instanceof Error ? error.message : error };
        logOAuth('error', '❌ Custom adapter test failed', results.customAdapterTest);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      diagnosis: {
        hasSessionToken: !!sessionToken,
        getServerSessionWorks: !!results.getServerSession && !results.getServerSession.error,
        authFunctionWorks: !!results.authFunction && !results.authFunction.error,
        customAdapterWorks: !!results.customAdapterTest && !results.customAdapterTest.error,
        mainIssue: !sessionToken ? 'No session token in cookies' :
                   results.getServerSession?.error ? 'getServerSession failing' :
                   !results.getServerSession?.found ? 'Session not found by NextAuth' :
                   'Unknown issue'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logOAuth('error', '❌ NextAuth session test failed', { 
      error: error instanceof Error ? error.message : error 
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}