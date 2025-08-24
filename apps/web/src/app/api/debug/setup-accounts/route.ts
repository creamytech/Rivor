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
      where: { email: userEmail },
      include: {
        accounts: true
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 400 });
    }

    // Find Google account
    const googleAccount = dbUser.accounts.find(acc => acc.provider === 'google');
    if (!googleAccount) {
      return NextResponse.json({ 
        error: 'No Google OAuth account found. Please re-authenticate first.',
        instructions: [
          '1. Sign out of your app completely',
          '2. Sign back in with Google',
          '3. Then try Setup Accounts again'
        ],
        debug: {
          userEmail,
          accountCount: dbUser.accounts.length,
          availableProviders: dbUser.accounts.map(acc => acc.provider)
        }
      }, { status: 400 });
    }

    const results = [];

    // Check if we have encrypted tokens in the Account record
    const hasTokens = googleAccount.access_token_enc || googleAccount.refresh_token_enc;
    
    if (!hasTokens) {
      return NextResponse.json({ 
        error: 'No encrypted tokens found in Google Account record. Please re-authenticate with Google.',
        debug: {
          accountId: googleAccount.id,
          provider: googleAccount.provider,
          hasAccessToken: !!googleAccount.access_token_enc,
          hasRefreshToken: !!googleAccount.refresh_token_enc
        }
      }, { status: 400 });
    }

    results.push({ 
      type: 'Account', 
      id: googleAccount.id, 
      message: 'OAuth tokens found in Account record',
      hasAccessToken: !!googleAccount.access_token_enc,
      hasRefreshToken: !!googleAccount.refresh_token_enc
    });

    // Create EmailAccount if it doesn't exist
    const existingEmailAccount = await prisma.emailAccount.findFirst({
      where: {
        userId: dbUser.id,
        provider: 'google'
      }
    });

    if (!existingEmailAccount) {
      try {
        const emailAccount = await prisma.emailAccount.create({
          data: {
            orgId,
            userId: dbUser.id,
            provider: 'google',
            externalAccountId: googleAccount.providerAccountId,
            email: userEmail,
            displayName: dbUser.name || userEmail,
            status: 'connected',
            syncStatus: 'idle',
            encryptionStatus: 'ok',
            tokenRef: `account-${googleAccount.id}`,
            tokenStatus: 'encrypted',
          }
        });
        results.push({ type: 'EmailAccount', id: emailAccount.id, created: true });
      } catch (emailError) {
        console.error('EmailAccount creation error:', emailError);
        results.push({ type: 'EmailAccount', created: false, error: emailError.message });
      }
    } else {
      results.push({ type: 'EmailAccount', id: existingEmailAccount.id, created: false, message: 'Already exists' });
    }

    // Create CalendarAccount if it doesn't exist
    const existingCalendarAccount = await prisma.calendarAccount.findFirst({
      where: {
        orgId,
        provider: 'google'
      }
    });

    if (!existingCalendarAccount) {
      try {
        const calendarAccount = await prisma.calendarAccount.create({
          data: {
            orgId,
            provider: 'google',
            status: 'connected'
          }
        });
        results.push({ type: 'CalendarAccount', id: calendarAccount.id, created: true });
      } catch (calendarError) {
        console.error('CalendarAccount creation error:', calendarError);
        results.push({ type: 'CalendarAccount', created: false, error: calendarError.message });
      }
    } else {
      results.push({ type: 'CalendarAccount', id: existingCalendarAccount.id, created: false, message: 'Already exists' });
    }

    return NextResponse.json({
      success: true,
      message: 'Account setup completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Setup accounts error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}