import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';

export async function GET(req: NextRequest) {
  try {
    // Test server-side auth
    const serverSession = await auth();
    
    return NextResponse.json({
      success: true,
      serverSession: {
        found: !!serverSession,
        user: serverSession?.user || null,
        expires: serverSession?.expires || null
      },
      instructions: {
        message: "Server session working. Check client-side with useSession() hook",
        nextSteps: [
          "1. Check if SessionProvider is wrapping the app properly",
          "2. Verify NextAuth client configuration",
          "3. Try refreshing the page or clearing cookies"
        ]
      },
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