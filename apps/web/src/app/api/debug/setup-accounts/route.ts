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
      return NextResponse.json({ error: 'No Google account found' }, { status: 400 });
    }

    const results = [];

    // Create SecureToken record first
    let secureToken = await prisma.secureToken.findFirst({
      where: {
        orgId,
        provider: 'google',
        encryptionStatus: 'ok'
      }
    });

    if (!secureToken) {
      try {
        // Check if we have encrypted tokens in the Account record
        const hasTokens = googleAccount.access_token_enc || googleAccount.refresh_token_enc;
        
        if (hasTokens) {
          secureToken = await prisma.secureToken.create({
            data: {
              orgId,
              provider: 'google',
              accessToken: googleAccount.access_token_enc,
              refreshToken: googleAccount.refresh_token_enc,
              expiresAt: googleAccount.expires_at ? new Date(googleAccount.expires_at * 1000) : null,
              scope: googleAccount.scope || 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar',
              encryptionStatus: 'ok',
              tokenType: 'Bearer'
            }
          });
          results.push({ type: 'SecureToken', id: secureToken.id, created: true });
        } else {
          results.push({ type: 'SecureToken', created: false, message: 'No encrypted tokens found in Account record' });
        }
      } catch (tokenError) {
        console.error('SecureToken creation error:', tokenError);
        results.push({ type: 'SecureToken', created: false, error: tokenError.message });
      }
    } else {
      results.push({ type: 'SecureToken', id: secureToken.id, created: false, message: 'Already exists' });
    }

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
            encryptionStatus: secureToken ? 'ok' : 'pending',
            tokenRef: secureToken ? `token-${secureToken.id}` : `token-${googleAccount.id}`,
            tokenStatus: secureToken ? 'encrypted' : 'missing',
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