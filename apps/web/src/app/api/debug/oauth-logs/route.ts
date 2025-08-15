import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

/**
 * Debug OAuth callback issues by checking recent activity
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Check for any user records
    const users = await prisma.user.findMany({
      where: { email: userEmail },
      include: {
        accounts: true,
        oauthAccounts: true,
        emailAccounts: true,
        orgMembers: {
          include: {
            org: true
          }
        }
      }
    });

    // Check for NextAuth accounts
    const nextAuthAccounts = await prisma.account.findMany({
      where: {
        user: {
          email: userEmail
        }
      },
      include: {
        user: true
      }
    });

    // Check recent organizations
    const recentOrgs = await prisma.org.findMany({
      where: {
        name: userEmail
      },
      include: {
        members: true,
        emailAccounts: true,
        calendarAccounts: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Get session info
    const sessionInfo = {
      email: session.user?.email,
      name: session.user?.name,
      image: session.user?.image,
      sessionOrgId: (session as any).orgId || 'not set'
    };

    return NextResponse.json({
      sessionInfo,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt,
        accountsCount: u.accounts.length,
        oauthAccountsCount: u.oauthAccounts.length,
        emailAccountsCount: u.emailAccounts.length,
        orgMembershipsCount: u.orgMembers.length
      })),
      nextAuthAccounts: nextAuthAccounts.map(a => ({
        id: a.id,
        provider: a.provider,
        type: a.type,
        userId: a.userId,
        hasAccessToken: !!a.access_token,
        hasRefreshToken: !!a.refresh_token,
        expiresAt: a.expires_at,
        createdAt: a.createdAt
      })),
      recentOrgs: recentOrgs.map(o => ({
        id: o.id,
        name: o.name,
        createdAt: o.createdAt,
        membersCount: o.members.length,
        emailAccountsCount: o.emailAccounts.length,
        calendarAccountsCount: o.calendarAccounts.length,
        hasEncryptedDek: !!o.encryptedDekBlob
      })),
      possibleIssues: [
        users.length === 0 ? 'No User record found' : null,
        nextAuthAccounts.length === 0 ? 'No NextAuth Account record found' : null,
        recentOrgs.length === 0 ? 'No Organization found' : null,
        recentOrgs.length > 0 && recentOrgs[0].emailAccountsCount === 0 ? 'Organization exists but no EmailAccounts' : null
      ].filter(Boolean),
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('OAuth logs debug error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get OAuth logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
