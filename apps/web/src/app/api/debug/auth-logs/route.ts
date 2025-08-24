import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get recent auth-related data to debug what's happening
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: {
            id: true,
            provider: true,
            providerAccountId: true,
            createdAt: true,
            access_token_enc: true,
            refresh_token_enc: true
          }
        }
      }
    });

    // Check sessions
    const sessions = await prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        userId: true,
        expires: true,
        createdAt: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    // Check if there are any orphaned accounts
    const orphanedAccounts = await prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        userId: true,
        createdAt: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    // Check orgs for KMS
    const orgs = await prisma.org.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      debug: {
        users: {
          count: users.length,
          data: users
        },
        sessions: {
          count: sessions.length,
          data: sessions
        },
        orphanedAccounts: {
          count: orphanedAccounts.length,
          data: orphanedAccounts
        },
        orgs: {
          count: orgs.length,
          data: orgs
        },
        totals: {
          totalUsers: await prisma.user.count(),
          totalAccounts: await prisma.account.count(),
          totalSessions: await prisma.session.count(),
          totalOrgs: await prisma.org.count()
        }
      }
    });

  } catch (error) {
    console.error('Auth logs error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}