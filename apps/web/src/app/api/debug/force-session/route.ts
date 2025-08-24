import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';

export async function GET(req: NextRequest) {
  try {
    // Get server-side session
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'No server session found',
        timestamp: new Date().toISOString()
      });
    }

    // Return session data for client to use
    return NextResponse.json({
      success: true,
      session: {
        user: session.user,
        expires: session.expires
      },
      message: 'Server session found - client should be able to access this',
      instruction: 'Use this endpoint data to verify server session exists',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}