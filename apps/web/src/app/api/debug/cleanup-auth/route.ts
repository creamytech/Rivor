import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Emergency auth cleanup for OAuthAccountNotLinked errors
 * This removes orphaned user/account data that prevents OAuth linking
 */
export async function POST(req: NextRequest) {
  try {
    // Only run in development or with explicit authorization
    const { authorization } = await req.json();
    
    if (process.env.NODE_ENV === 'production' && authorization !== 'EMERGENCY_CLEANUP') {
      return NextResponse.json({ 
        error: 'Not authorized for production cleanup' 
      }, { status: 403 });
    }

    console.log('🧹 Starting emergency auth cleanup...');

    // Delete all NextAuth sessions, accounts, and verification tokens
    const deletions = await Promise.all([
      prisma.session.deleteMany({}),
      prisma.account.deleteMany({}),
      prisma.verificationToken.deleteMany({}),
      // Only delete users that don't have org memberships
      prisma.user.deleteMany({
        where: {
          orgMembers: {
            none: {}
          }
        }
      })
    ]);

    const results = {
      sessionsDeleted: deletions[0].count,
      accountsDeleted: deletions[1].count,
      verificationTokensDeleted: deletions[2].count,
      orphanedUsersDeleted: deletions[3].count
    };

    console.log('🧹 Cleanup results:', results);

    // Verify cleanup
    const finalCounts = {
      users: await prisma.user.count(),
      accounts: await prisma.account.count(),
      sessions: await prisma.session.count(),
      organizations: await prisma.org.count()
    };

    return NextResponse.json({
      success: true,
      message: 'Auth cleanup completed',
      deletions: results,
      finalCounts,
      recommendation: 'Try OAuth sign-in again - should work now'
    });

  } catch (error) {
    console.error('❌ Auth cleanup failed:', error);
    return NextResponse.json({ 
      error: 'Cleanup failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Show current auth table status
    const counts = {
      users: await prisma.user.count(),
      accounts: await prisma.account.count(),  
      sessions: await prisma.session.count(),
      verificationTokens: await prisma.verificationToken.count(),
      organizations: await prisma.org.count(),
      orgMembers: await prisma.orgMember.count()
    };

    // Show orphaned users (users without org memberships)
    const orphanedUsers = await prisma.user.findMany({
      where: {
        orgMembers: {
          none: {}
        }
      },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      counts,
      orphanedUsers,
      diagnosis: orphanedUsers.length > 0 
        ? 'Orphaned users found - these prevent OAuth linking'
        : 'No orphaned users - OAuth should work'
    });

  } catch (error) {
    console.error('❌ Auth status check failed:', error);
    return NextResponse.json({ 
      error: 'Status check failed',
      details: error instanceof Error ? error.message : String(error)  
    }, { status: 500 });
  }
}