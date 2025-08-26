import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createCustomPrismaAdapter } from '@/server/auth-adapter';
import { logOAuth } from '@/lib/oauth-logger';

// Override NextAuth's session endpoint to use our working adapter
export async function GET(req: NextRequest) {
  try {
    logOAuth('info', '🔧 Custom session endpoint called');
    
    // Get session token from cookies (await for Next.js 15)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('__Secure-next-auth.session-token')?.value || 
                        cookieStore.get('next-auth.session-token')?.value;

    if (!sessionToken) {
      logOAuth('info', '❌ No session token found in cookies');
      return NextResponse.json({});
    }

    logOAuth('info', '🔍 Found session token, using custom adapter');
    
    // Use our custom adapter directly
    const adapter = createCustomPrismaAdapter();
    
    if (!adapter.getSessionAndUser) {
      logOAuth('error', '❌ No getSessionAndUser method in adapter');
      return NextResponse.json({});
    }

    const result = await adapter.getSessionAndUser(sessionToken);
    
    if (!result || !result.session || !result.user) {
      logOAuth('info', '❌ No session/user data from adapter');
      return NextResponse.json({});
    }

    // Format session data exactly like NextAuth expects
    const session = {
      user: {
        email: result.user.email,
        name: result.user.name,
        image: result.user.image,
      },
      expires: result.session.expires.toISOString()
    };

    logOAuth('info', '✅ Custom session endpoint success', { 
      userEmail: session.user.email,
      expires: session.expires 
    });

    // Set proper headers
    const response = NextResponse.json(session);
    response.headers.set('Cache-Control', 'no-store');
    return response;

  } catch (error) {
    logOAuth('error', '❌ Custom session endpoint failed', { 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({});
  }
}