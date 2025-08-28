import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Public debug endpoint (no auth required) to diagnose OAuth issues
 */
export async function GET() {
  try {
    // Get basic stats without requiring authentication
    const stats = {
      totalUsers: await prisma.user.count(),
      totalOrganizations: await prisma.org.count(),
      totalOrgMembers: await prisma.orgMember.count(),
      totalAccounts: await prisma.account.count(),
      totalSessions: await prisma.session.count(),
    };

    // Get orphaned users (users without org memberships)
    const orphanedUsers = await prisma.user.findMany({
      where: {
        orgMembers: {
          none: {}
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            accounts: true,
            sessions: true
          }
        }
      }
    });

    // Get recent OAuth accounts to see if they're being created
    const recentAccounts = await prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        provider: true,
        providerAccountId: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            _count: {
              select: {
                orgMembers: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      stats,
      problem: {
        description: stats.totalUsers > 0 && stats.totalOrganizations === 0 
          ? 'Users exist but no organizations - onboarding is failing'
          : 'Normal state or no users yet',
        orphanedUsersCount: orphanedUsers.length,
        orphanedUsers: orphanedUsers.map(user => ({
          email: user.email,
          createdAt: user.createdAt,
          accountsCount: user._count.accounts,
          sessionsCount: user._count.sessions
        }))
      },
      recentAccountCreations: recentAccounts,
      diagnosis: getDiganosis(stats, orphanedUsers.length),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Public auth debug failed:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, email } = await request.json();

    if (action === 'cleanup_orphans') {
      // Clean up orphaned users (public action for fixing auth issues)
      const orphanedUsers = await prisma.user.findMany({
        where: {
          orgMembers: { none: {} }
        },
        include: {
          accounts: true,
          sessions: true
        }
      });

      let deletedSessions = 0;
      let deletedAccounts = 0;

      // Delete related data first
      for (const user of orphanedUsers) {
        if (user.sessions.length > 0) {
          const sessionResult = await prisma.session.deleteMany({
            where: { userId: user.id }
          });
          deletedSessions += sessionResult.count;
        }
        
        if (user.accounts.length > 0) {
          const accountResult = await prisma.account.deleteMany({
            where: { userId: user.id }
          });
          deletedAccounts += accountResult.count;
        }
      }

      // Delete orphaned users
      const userResult = await prisma.user.deleteMany({
        where: {
          orgMembers: { none: {} }
        }
      });

      return NextResponse.json({
        success: true,
        action: 'cleanup_orphans',
        results: {
          usersDeleted: userResult.count,
          accountsDeleted: deletedAccounts,
          sessionsDeleted: deletedSessions
        },
        message: 'Cleanup complete - try OAuth sign-in again'
      });
    }

    if (action === 'test_onboarding' && email) {
      // Test if we can import and run the onboarding function
      try {
        const { handleOAuthCallback } = await import("@/server/onboarding");
        
        return NextResponse.json({
          success: true,
          action: 'test_onboarding',
          result: 'Onboarding function imported successfully',
          message: 'Onboarding system is available'
        });
      } catch (importError) {
        return NextResponse.json({
          success: false,
          action: 'test_onboarding',
          error: 'Failed to import onboarding function',
          details: importError instanceof Error ? importError.message : String(importError)
        });
      }
    }

    return NextResponse.json({ 
      error: 'Invalid action. Use cleanup_orphans or test_onboarding' 
    }, { status: 400 });

  } catch (error) {
    console.error('Public auth debug POST failed:', error);
    return NextResponse.json({ 
      error: 'Action failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

function getDiganosis(stats: any, orphanedCount: number): string {
  if (stats.totalUsers === 0) {
    return 'No users in system - OAuth sign-in should work normally';
  }
  
  if (stats.totalUsers > 0 && stats.totalOrganizations === 0) {
    return 'PROBLEM: Users exist but no organizations - onboarding process is failing during OAuth';
  }
  
  if (orphanedCount > 0) {
    return `PROBLEM: ${orphanedCount} orphaned users preventing OAuth linking`;
  }
  
  return 'System appears healthy';
}