import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    logger.info('Calendar setup initiated', { orgId, userEmail: session.user.email });

    // Check if email account exists with Google OAuth
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        orgId,
        provider: 'google'
      }
    });

    if (!emailAccount) {
      return NextResponse.json({
        error: 'No Google email account found',
        message: 'Please connect your Google email account first in Settings → Integrations',
        action: 'connect_email_first'
      }, { status: 400 });
    }

    if (!emailAccount.externalAccountId) {
      return NextResponse.json({
        error: 'Email account missing external ID',
        message: 'Please reconnect your Google email account',
        action: 'reconnect_email'
      }, { status: 400 });
    }

    // Check if secure tokens exist
    const secureTokens = await prisma.secureToken.findMany({
      where: {
        orgId,
        provider: 'google',
        encryptionStatus: 'ok'
      }
    });

    if (secureTokens.length === 0) {
      return NextResponse.json({
        error: 'No OAuth tokens found',
        message: 'Please reconnect your Google account to refresh tokens',
        action: 'reauthenticate_google'
      }, { status: 400 });
    }

    const hasAccessToken = secureTokens.some(t => t.tokenType === 'oauth_access');
    if (!hasAccessToken) {
      return NextResponse.json({
        error: 'Access token not found',
        message: 'Please reconnect your Google account',
        action: 'reauthenticate_google'
      }, { status: 400 });
    }

    // Check if calendar account already exists
    let calendarAccount = await prisma.calendarAccount.findFirst({
      where: {
        orgId,
        provider: 'google'
      }
    });

    if (!calendarAccount) {
      // Create calendar account automatically
      calendarAccount = await prisma.calendarAccount.create({
        data: {
          orgId,
          provider: 'google',
          status: 'connected'
        }
      });
      
      logger.info('Calendar account created', { 
        orgId, 
        calendarAccountId: calendarAccount.id 
      });
    }

    // Update calendar account status
    await prisma.calendarAccount.update({
      where: { id: calendarAccount.id },
      data: { 
        status: 'connected',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Calendar account setup successful',
      calendarAccount: {
        id: calendarAccount.id,
        provider: calendarAccount.provider,
        status: 'connected'
      },
      nextStep: 'sync_calendar'
    });

  } catch (error) {
    logger.error('Calendar setup failed', { error });
    return NextResponse.json({
      error: 'Calendar setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}