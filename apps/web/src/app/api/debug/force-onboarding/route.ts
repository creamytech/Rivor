import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { handleOAuthCallback } from '@/server/onboarding';

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Force onboarding triggered');
    
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated session',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // Get the user's OAuth account
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          where: { provider: 'google' }
        }
      }
    });

    if (!user || user.accounts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User or Google account not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    const account = user.accounts[0];

    // Force run onboarding
    const onboardingResult = await handleOAuthCallback({
      userId: user.id,
      userEmail: user.email,
      userName: user.name || undefined,
      userImage: user.image || undefined,
      provider: account.provider,
      externalAccountId: account.providerAccountId,
      account: {
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state
      }
    });

    console.log('🚀 Force onboarding completed:', onboardingResult);

    // Check the results
    const updatedUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        orgMembers: {
          include: { 
            org: {
              include: {
                calendarAccounts: true
              }
            }
          }
        },
        emailAccounts: true
      }
    });

    return NextResponse.json({
      success: true,
      onboardingResult,
      userStatus: {
        hasOrg: (updatedUser?.orgMembers.length || 0) > 0,
        orgId: updatedUser?.orgMembers[0]?.orgId || null,
        orgName: updatedUser?.orgMembers[0]?.org?.name || null,
        emailAccountsCount: updatedUser?.emailAccounts.length || 0,
        calendarAccountsCount: updatedUser?.orgMembers[0]?.org?.calendarAccounts?.length || 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Force onboarding failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}