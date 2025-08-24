import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 400 });
    }

    // Check if Account already exists
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: dbUser.id,
        provider: 'google'
      }
    });

    if (existingAccount) {
      return NextResponse.json({ 
        message: 'Account record already exists',
        accountId: existingAccount.id
      });
    }

    // Create a basic Account record
    // Note: Without fresh tokens from OAuth flow, we create a placeholder
    const account = await prisma.account.create({
      data: {
        userId: dbUser.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: (session.user as any).providerId || 'unknown',
        // These would normally come from fresh OAuth tokens
        access_token: 'placeholder-needs-reauth',
        refresh_token: null,
        expires_at: null,
        token_type: 'Bearer',
        scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar',
        id_token: null,
        session_state: null,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Account record created successfully',
      accountId: account.id,
      note: 'You may need to re-authorize with Google to get fresh tokens for Gmail/Calendar access',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}