import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Redirect to the existing NextAuth Google sign-in
    const signInUrl = 'https://www.rivor.ai/auth/signin?provider=google&callbackUrl=https://www.rivor.ai/app';

    return NextResponse.json({
      success: true,
      message: 'Redirect to existing NextAuth Google sign-in',
      signInUrl,
      instructions: [
        '1. Click the signInUrl to go to the existing Google sign-in page',
        '2. Sign in with Google (this will refresh your OAuth tokens)',
        '3. You will be redirected back to the app dashboard',
        '4. The new tokens will be automatically encrypted and stored'
      ],
      note: 'This uses the existing NextAuth OAuth flow which is already configured and working',
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
