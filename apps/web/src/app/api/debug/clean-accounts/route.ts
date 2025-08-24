import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { logOAuth } from '@/lib/oauth-logger';

export async function DELETE(req: NextRequest) {
  try {
    const email = 'benjaminscott18@gmail.com';
    logOAuth('info', `🧹 Cleaning Account records for ${email}`);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
        sessions: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Delete all accounts for this user
    const deletedAccounts = await prisma.account.deleteMany({
      where: { userId: user.id }
    });

    // Delete all sessions to force re-auth
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: user.id }
    });

    logOAuth('info', '✅ Account cleanup completed', {
      email,
      deletedAccounts: deletedAccounts.count,
      deletedSessions: deletedSessions.count
    });

    return NextResponse.json({
      success: true,
      message: `Cleaned up accounts for ${email}`,
      deleted: {
        accounts: deletedAccounts.count,
        sessions: deletedSessions.count
      },
      nextStep: 'Try OAuth sign-in again - linkAccount should be called',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logOAuth('error', '❌ Account cleanup failed', { 
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
    message: 'Use DELETE method to clean Account records',
    usage: 'DELETE /api/debug/clean-accounts'
  });
}