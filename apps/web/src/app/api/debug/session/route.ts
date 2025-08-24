import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get full session info
    const sessionInfo = {
      user: session.user,
      expires: session.expires,
      orgId: (session as any).orgId,
      fullSession: session
    };

    // Check what's in the database for this user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        emailAccounts: true,
        accounts: true,
        orgMembers: {
          include: { org: true }
        }
      }
    });

    // Check for OAuth accounts
    const oauthAccounts = await prisma.account.findMany({
      where: { 
        user: {
          email: session.user.email
        }
      }
    });

    return NextResponse.json({
      sessionInfo,
      databaseUser: user,
      oauthAccounts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}