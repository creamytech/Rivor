import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

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

    // Check if calendar account already exists
    const existingAccount = await prisma.calendarAccount.findFirst({
      where: { orgId, provider: 'google' }
    });

    if (existingAccount) {
      return NextResponse.json({
        success: true,
        message: 'Calendar account already exists',
        account: {
          id: existingAccount.id,
          provider: existingAccount.provider,
          status: existingAccount.status
        }
      });
    }

    // Check if we have Google OAuth tokens
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

    // Create calendar account
    const calendarAccount = await prisma.calendarAccount.create({
      data: {
        orgId,
        provider: 'google',
        status: 'connected'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Calendar account created successfully',
      account: {
        id: calendarAccount.id,
        provider: calendarAccount.provider,
        status: calendarAccount.status
      }
    });

  } catch (error) {
    console.error('Failed to setup calendar:', error);
    return NextResponse.json(
      { error: 'Failed to setup calendar', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
