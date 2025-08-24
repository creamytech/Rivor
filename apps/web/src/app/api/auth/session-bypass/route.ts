import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createCustomPrismaAdapter } from '@/server/auth-adapter';
import { logOAuth } from '@/lib/oauth-logger';

// Temporary bypass for NextAuth session issues
export async function GET(req: NextRequest) {
  try {
    logOAuth('info', '🔧 Bypassing NextAuth session retrieval');
    
    // Get session token from cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('__Secure-next-auth.session-token')?.value || 
                        cookieStore.get('next-auth.session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({}, { status: 200 }); // Return empty like NextAuth does
    }

    // Use our custom adapter directly
    const adapter = createCustomPrismaAdapter();
    
    if (!adapter.getSessionAndUser) {
      return NextResponse.json({}, { status: 200 });
    }

    const result = await adapter.getSessionAndUser(sessionToken);
    
    if (!result || !result.session || !result.user) {
      return NextResponse.json({}, { status: 200 });
    }

    // Format session data like NextAuth expects
    const session = {
      user: {
        email: result.user.email,
        name: result.user.name,
        image: result.user.image,
      },
      expires: result.session.expires.toISOString()
    };

    logOAuth('info', '✅ Session bypass successful', { 
      userEmail: session.user.email,
      expires: session.expires 
    });

    return NextResponse.json(session);

  } catch (error) {
    logOAuth('error', '❌ Session bypass failed', { 
      error: error instanceof Error ? error.message : error 
    });
    
    return NextResponse.json({}, { status: 200 }); // Return empty on error like NextAuth
  }
}