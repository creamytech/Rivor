import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        accounts: true
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 400 });
    }

    // Find Google account
    const googleAccount = dbUser.accounts.find(acc => acc.provider === 'google');

    return NextResponse.json({
      user: {
        email: userEmail,
        accountCount: dbUser.accounts.length
      },
      googleAccount: googleAccount ? {
        id: googleAccount.id,
        provider: googleAccount.provider,
        providerAccountId: googleAccount.providerAccountId,
        type: googleAccount.type,
        scope: googleAccount.scope,
        token_type: googleAccount.token_type,
        expires_at: googleAccount.expires_at,
        // Show which encrypted fields exist (but not values)
        hasAccessToken: !!googleAccount.access_token_enc,
        hasRefreshToken: !!googleAccount.refresh_token_enc,
        hasIdToken: !!googleAccount.id_token_enc,
        // Show field names available
        availableFields: Object.keys(googleAccount).filter(key => 
          !['id', 'userId', 'createdAt', 'updatedAt'].includes(key)
        ).sort()
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Check tokens error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}