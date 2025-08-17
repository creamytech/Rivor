import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logger } from '@/lib/logger';

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

    // Get calendar accounts without tokenRef
    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: { 
        orgId, 
        provider: 'google',
        OR: [
          { tokenRef: null },
          { tokenRef: '' }
        ]
      }
    });

    if (calendarAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No calendar accounts found that need token fixing'
      });
    }

    // Get secure tokens for this org
    const secureTokens = await prisma.secureToken.findMany({
      where: {
        orgId,
        provider: 'google',
        encryptionStatus: 'ok'
      }
    });

    if (secureTokens.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No Google OAuth tokens found. Please connect your Google account first.'
      }, { status: 400 });
    }

    // Get the first access token to use as reference
    const accessToken = secureTokens.find(t => t.tokenType === 'oauth_access');
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        message: 'No access token found in secure tokens'
      }, { status: 400 });
    }

    // Update calendar accounts with tokenRef
    const updateResults = [];
    for (const account of calendarAccounts) {
      try {
        const updatedAccount = await prisma.calendarAccount.update({
          where: { id: account.id },
          data: { 
            tokenRef: accessToken.id,
            status: 'connected'
          }
        });

        updateResults.push({
          accountId: account.id,
          status: 'success',
          tokenRef: updatedAccount.tokenRef
        });
      } catch (error) {
        updateResults.push({
          accountId: account.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Calendar token references fixed', {
      orgId,
      accountsFixed: updateResults.filter(r => r.status === 'success').length,
      totalAccounts: calendarAccounts.length
    });

    return NextResponse.json({
      success: true,
      message: `Fixed token references for ${updateResults.filter(r => r.status === 'success').length} calendar account(s)`,
      results: updateResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to fix calendar tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fix calendar tokens', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
