import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const orgId = (session as any).orgId || 'default';

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 400 });
    }

    const results = [];

    // Delete existing EmailAccount
    const deletedEmailAccounts = await prisma.emailAccount.deleteMany({
      where: {
        userId: dbUser.id,
        provider: 'google'
      }
    });
    results.push({ type: 'EmailAccount', action: 'deleted', count: deletedEmailAccounts.count });

    // Delete existing CalendarAccount
    const deletedCalendarAccounts = await prisma.calendarAccount.deleteMany({
      where: {
        orgId,
        provider: 'google'
      }
    });
    results.push({ type: 'CalendarAccount', action: 'deleted', count: deletedCalendarAccounts.count });

    // Delete existing SecureTokens
    const deletedSecureTokens = await prisma.secureToken.deleteMany({
      where: {
        orgId,
        provider: 'google'
      }
    });
    results.push({ type: 'SecureToken', action: 'deleted', count: deletedSecureTokens.count });

    return NextResponse.json({
      success: true,
      message: 'Accounts cleaned up successfully',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cleanup accounts error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}