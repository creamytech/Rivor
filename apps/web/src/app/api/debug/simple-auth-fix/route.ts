import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Simple fix for OAuthAccountNotLinked - just remove orphaned users
 */
export async function POST(req: NextRequest) {
  try {
    const { authorization } = await req.json();
    
    if (process.env.NODE_ENV === 'production' && authorization !== 'EMERGENCY_CLEANUP') {
      return NextResponse.json({ 
        error: 'Not authorized' 
      }, { status: 403 });
    }

    console.log('🔧 Simple auth fix: removing orphaned users...');

    // Find and delete users without org memberships (these cause the linking issue)
    const orphanedUsers = await prisma.user.findMany({
      where: {
        orgMembers: {
          none: {}
        }
      },
      include: {
        accounts: true,
        sessions: true
      }
    });

    console.log(`Found ${orphanedUsers.length} orphaned users`);

    let deletedSessions = 0;
    let deletedAccounts = 0;

    // Delete related sessions and accounts first
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

    // Now delete the orphaned users
    const userResult = await prisma.user.deleteMany({
      where: {
        orgMembers: {
          none: {}
        }
      }
    });

    const result = {
      orphanedUsersDeleted: userResult.count,
      relatedSessionsDeleted: deletedSessions,
      relatedAccountsDeleted: deletedAccounts,
      message: 'OAuth should work now - try signing in!'
    };

    console.log('🔧 Simple fix results:', result);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Simple auth fix failed:', error);
    return NextResponse.json({ 
      error: 'Fix failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Show orphaned users that need cleanup
    const orphanedUsers = await prisma.user.findMany({
      where: {
        orgMembers: {
          none: {}
        }
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            accounts: true,
            sessions: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      orphanedUsersCount: orphanedUsers.length,
      orphanedUsers,
      diagnosis: orphanedUsers.length > 0 
        ? 'These orphaned users prevent OAuth linking - run POST to fix'
        : 'No orphaned users - OAuth should work normally'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Status check failed',
      details: error instanceof Error ? error.message : String(error)  
    }, { status: 500 });
  }
}