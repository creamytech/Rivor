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

    // Delete NextAuth data carefully (skip VerificationToken if it has replica identity issues)
    const deletions = await Promise.allSettled([
      prisma.session.deleteMany({}),
      prisma.account.deleteMany({}),
      // Skip verification tokens due to replica identity issue
      // prisma.verificationToken.deleteMany({}),
      Promise.resolve({ count: 0 }), // Placeholder for verification tokens
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
      sessionsDeleted: deletions[0].status === 'fulfilled' ? (deletions[0].value as any).count : 0,
      accountsDeleted: deletions[1].status === 'fulfilled' ? (deletions[1].value as any).count : 0,
      verificationTokensDeleted: 'skipped (replica identity issue)',
      orphanedUsersDeleted: deletions[3].status === 'fulfilled' ? (deletions[3].value as any).count : 0,
      errors: deletions.filter(d => d.status === 'rejected').map(d => d.status === 'rejected' ? d.reason : null)
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