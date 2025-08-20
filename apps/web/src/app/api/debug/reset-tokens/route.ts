import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(__request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const orgId = (session as { orgId?: string }).orgId;

    if (!orgId || orgId === 'unknown') {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    logger.info('Resetting corrupted tokens', {
      userEmail,
      orgId
    });

    // Delete all SecureToken records for this org
    const deletedTokens = await prisma.secureToken.deleteMany({
      where: { orgId }
    });

    // Reset EmailAccount token status
    const updatedAccounts = await prisma.emailAccount.updateMany({
      where: { orgId },
      data: {
        tokenStatus: 'pending_encryption',
        encryptionStatus: 'pending',
        tokenRef: null,
        kmsErrorCode: null,
        kmsErrorAt: null,
        syncStatus: 'idle',
        errorReason: null
      }
    });

    // Reset CalendarAccount status
    const updatedCalendarAccounts = await prisma.calendarAccount.updateMany({
      where: { orgId },
      data: {
        status: 'disconnected'
      }
    });

    // Clear any existing email/calendar data for this org
    const deletedMessages = await prisma.emailMessage.deleteMany({
      where: { orgId }
    });

    const deletedThreads = await prisma.emailThread.deleteMany({
      where: { orgId }
    });

    const deletedEvents = await prisma.calendarEvent.deleteMany({
      where: { orgId }
    });

    return NextResponse.json({
      success: true,
      message: 'Tokens and data reset successfully. Please re-authenticate with Google.',
      deletedTokens: deletedTokens.count,
      updatedEmailAccounts: updatedAccounts.count,
      updatedCalendarAccounts: updatedCalendarAccounts.count,
      deletedMessages: deletedMessages.count,
      deletedThreads: deletedThreads.count,
      deletedEvents: deletedEvents.count,
      nextSteps: [
        'Sign out of the application',
        'Sign back in with Google',
        'Grant Gmail and Calendar permissions',
        'Tokens will be re-encrypted with current KMS setup'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Failed to reset tokens', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: "Failed to reset tokens", details: error.message }, { status: 500 });
  }
}
