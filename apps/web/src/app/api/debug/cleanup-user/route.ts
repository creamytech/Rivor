import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { logOAuth } from '@/lib/oauth-logger';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email parameter required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    logOAuth('info', `🧹 Starting cleanup for user: ${email}`);
    
    // Find the user first
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
        sessions: true,
        // Add other relations that might exist
        emailAccounts: true,
        calendarAccounts: true
      }
    });

    if (!user) {
      logOAuth('warn', `👻 User not found: ${email}`);
      return NextResponse.json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    logOAuth('info', '📊 Found user data to clean', {
      userId: user.id,
      accounts: user.accounts.length,
      sessions: user.sessions.length,
      emailAccounts: user.emailAccounts.length,
      calendarAccounts: user.calendarAccounts.length
    });

    // Delete in correct order (children first, then parent)
    const deletionSteps: string[] = [];

    // 1. Delete sessions
    if (user.sessions.length > 0) {
      await prisma.session.deleteMany({
        where: { userId: user.id }
      });
      deletionSteps.push(`Deleted ${user.sessions.length} sessions`);
    }

    // 2. Delete accounts (OAuth)
    if (user.accounts.length > 0) {
      await prisma.account.deleteMany({
        where: { userId: user.id }
      });
      deletionSteps.push(`Deleted ${user.accounts.length} OAuth accounts`);
    }

    // 3. Delete email accounts
    if (user.emailAccounts.length > 0) {
      await prisma.emailAccount.deleteMany({
        where: { userId: user.id }
      });
      deletionSteps.push(`Deleted ${user.emailAccounts.length} email accounts`);
    }

    // 4. Delete calendar accounts
    if (user.calendarAccounts.length > 0) {
      await prisma.calendarAccount.deleteMany({
        where: { userId: user.id }
      });
      deletionSteps.push(`Deleted ${user.calendarAccounts.length} calendar accounts`);
    }

    // 5. Finally delete the user
    await prisma.user.delete({
      where: { id: user.id }
    });
    deletionSteps.push(`Deleted user: ${user.email}`);

    logOAuth('info', '✅ User cleanup completed', { 
      email, 
      steps: deletionSteps 
    });

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up user: ${email}`,
      deletionSteps,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logOAuth('error', '❌ User cleanup failed', { 
      error: error instanceof Error ? error.message : error 
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Use DELETE method with ?email=your@email.com to cleanup user',
    example: '/api/debug/cleanup-user?email=benjaminscott18@gmail.com'
  });
}