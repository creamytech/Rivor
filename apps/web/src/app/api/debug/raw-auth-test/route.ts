import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { logOAuth } from '@/lib/oauth-logger';

export async function GET(req: NextRequest) {
  try {
    logOAuth('info', '🧪 Raw NextAuth test - bypassing custom adapter logging');
    
    console.log('🔍 Raw auth test - checking NextAuth configuration');
    console.log('🔍 Auth options keys:', Object.keys(authOptions));
    console.log('🔍 Session strategy:', authOptions.session?.strategy);
    console.log('🔍 Has adapter:', !!authOptions.adapter);
    console.log('🔍 Secret configured:', !!authOptions.secret);
    
    // Test getServerSession directly with minimal logging
    console.log('🔍 Calling getServerSession directly...');
    const session = await getServerSession(authOptions);
    console.log('🔍 Direct getServerSession result:', !!session);
    
    // Check if the issue is cookie parsing
    const cookieHeader = req.headers.get('cookie') || '';
    console.log('🔍 Cookie header length:', cookieHeader.length);
    console.log('🔍 Cookie header preview:', cookieHeader.substring(0, 200) + '...');
    
    const sessionCookies = cookieHeader
      .split(';')
      .filter(c => c.includes('session-token'))
      .map(c => c.trim());
    
    console.log('🔍 Session token cookies found:', sessionCookies.length);
    sessionCookies.forEach((cookie, i) => {
      console.log(`🔍 Cookie ${i + 1}:`, cookie.substring(0, 50) + '...');
    });
    
    return NextResponse.json({
      success: true,
      session: {
        found: !!session,
        user: session?.user || null
      },
      configuration: {
        strategy: authOptions.session?.strategy,
        hasAdapter: !!authOptions.adapter,
        hasSecret: !!authOptions.secret,
        cookieHeaderLength: cookieHeader.length,
        sessionCookiesFound: sessionCookies.length
      },
      cookies: sessionCookies.map(c => c.substring(0, 50) + '...'),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Raw auth test failed:', error);
    logOAuth('error', '❌ Raw auth test failed', { 
      error: error instanceof Error ? error.message : error 
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}