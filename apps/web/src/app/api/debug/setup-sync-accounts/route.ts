import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logOAuth } from '@/lib/oauth-logger';

export async function POST(req: NextRequest) {
  try {
    logOAuth('info', '🔧 Setting up EmailAccount and CalendarAccount records');
    
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const userEmail = session.user.email;
    
    // Find the user and their Google account
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        accounts: {
          where: { provider: 'google' }
        }
      }
    });

    if (!user || user.accounts.length === 0) {
      return NextResponse.json({ 
        error: 'No Google account found for user' 
      }, { status: 400 });
    }

    const googleAccount = user.accounts[0];
    const results = { created: [], updated: [], errors: [] };

    // Create or update EmailAccount
    try {
      const emailAccount = await prisma.emailAccount.upsert({
        where: {
          orgId_provider_externalAccountId: {
            orgId,
            provider: 'google',
            externalAccountId: googleAccount.providerAccountId
          }
        },
        update: {
          provider: 'google',
          status: 'connected',
          encryptionStatus: 'ok',
          externalAccountId: googleAccount.providerAccountId,
          tokenRef: googleAccount.id,
          tokenStatus: 'encrypted',
          lastSyncedAt: null,
          syncStatus: 'idle'
        },
        create: {
          orgId,
          userId: user.id,
          email: userEmail,
          provider: 'google',
          status: 'connected',
          encryptionStatus: 'ok',
          externalAccountId: googleAccount.providerAccountId,
          tokenRef: googleAccount.id,
          tokenStatus: 'encrypted',
          lastSyncedAt: null,
          syncStatus: 'idle'
        }
      });

      results.created.push(`EmailAccount: ${emailAccount.id}`);
      logOAuth('info', '✅ EmailAccount created/updated', { 
        id: emailAccount.id,
        email: emailAccount.email 
      });
    } catch (error) {
      results.errors.push(`EmailAccount error: ${error.message}`);
      logOAuth('error', '❌ EmailAccount creation failed', { error: error.message });
    }

    // Create or update CalendarAccount  
    try {
      const calendarAccount = await prisma.calendarAccount.upsert({
        where: {
          orgId_provider: {
            orgId,
            provider: 'google'
          }
        },
        update: {
          provider: 'google',
          status: 'connected'
        },
        create: {
          orgId,
          provider: 'google',
          status: 'connected'
        }
      });

      results.created.push(`CalendarAccount: ${calendarAccount.id}`);
      logOAuth('info', '✅ CalendarAccount created/updated', { 
        id: calendarAccount.id,
        provider: calendarAccount.provider 
      });
    } catch (error) {
      results.errors.push(`CalendarAccount error: ${error.message}`);
      logOAuth('error', '❌ CalendarAccount creation failed', { error: error.message });
    }

    return NextResponse.json({
      success: true,
      message: 'Sync accounts setup complete',
      orgId,
      userEmail,
      googleAccountId: googleAccount.id,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logOAuth('error', '❌ Setup sync accounts failed', { 
      error: error instanceof Error ? error.message : error 
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}