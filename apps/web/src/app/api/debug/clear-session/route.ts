import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { logOAuth } from '@/lib/oauth-logger';

export async function POST(req: NextRequest) {
  try {
    logOAuth('info', '🧹 Clearing broken session');
    
    // Get the session token from cookie
    const cookies = req.headers.get('cookie') || '';
    const sessionToken = cookies
      .split(';')
      .find(cookie => cookie.trim().startsWith('__Secure-next-auth.session-token='))
      ?.split('=')[1];
    
    if (sessionToken) {
      // Delete the session from database
      await prisma.session.deleteMany({
        where: { sessionToken }
      });
      
      logOAuth('info', '✅ Session deleted from database');
    }
    
    // Return response that clears the cookies
    const response = NextResponse.json({
      success: true,
      message: 'Session cleared. Please sign in again.',
      clearedToken: sessionToken ? sessionToken.substring(0, 20) + '...' : 'none',
      timestamp: new Date().toISOString()
    });
    
    // Clear the session cookie
    response.cookies.set('__Secure-next-auth.session-token', '', {
      expires: new Date(0),
      path: '/',
      domain: '.rivor.ai'
    });
    
    // Also clear other auth cookies
    response.cookies.set('__Host-next-auth.csrf-token', '', {
      expires: new Date(0),
      path: '/'
    });
    
    response.cookies.set('__Secure-next-auth.callback-url', '', {
      expires: new Date(0),
      path: '/',
      domain: '.rivor.ai'
    });
    
    return response;
    
  } catch (error) {
    logOAuth('error', '❌ Failed to clear session', { 
      error: error instanceof Error ? error.message : error 
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}