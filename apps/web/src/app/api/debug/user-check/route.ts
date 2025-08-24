import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'No session found',
        hasSession: false,
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // Check if user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: true,
        oauthAccounts: true,
        emailAccounts: true,
        orgMembers: {
          include: { org: true }
        }
      }
    });

    return NextResponse.json({
      hasSession: true,
      sessionUser: {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image
      },
      orgId: (session as any).orgId,
      databaseUser: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        accountCount: dbUser.accounts.length,
        oauthAccountCount: dbUser.oauthAccounts.length,
        emailAccountCount: dbUser.emailAccounts.length,
        orgMemberCount: dbUser.orgMembers.length,
        orgDetails: dbUser.orgMembers.map(m => ({ id: m.org.id, name: m.org.name }))
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}