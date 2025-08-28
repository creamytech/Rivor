import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to manually trigger onboarding for existing user
 */
export async function POST(req: NextRequest) {
  try {
    const { userEmail, authorization } = await req.json();
    
    if (process.env.NODE_ENV === 'production' && authorization !== 'EMERGENCY_CLEANUP') {
      return NextResponse.json({ 
        error: 'Not authorized' 
      }, { status: 403 });
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail required' }, { status: 400 });
    }

    console.log('🔧 Manual onboarding for:', userEmail);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        accounts: true,
        orgMembers: {
          include: { org: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.orgMembers.length > 0) {
      return NextResponse.json({ 
        message: 'User already has organization',
        orgId: user.orgMembers[0].orgId,
        orgName: user.orgMembers[0].org.name
      });
    }

    // Get the Google account
    const googleAccount = user.accounts.find(acc => acc.provider === 'google');
    if (!googleAccount) {
      return NextResponse.json({ error: 'No Google account found' }, { status: 400 });
    }

    try {
      // Import and run onboarding
      console.log('🔧 Importing onboarding function...');
      const { handleOAuthCallback } = await import("@/server/onboarding");
      console.log('🔧 Running manual onboarding...');
      
      const onboardingResult = await handleOAuthCallback({
        userId: user.id,
        userEmail: user.email!,
        userName: user.name || undefined,
        userImage: user.image || undefined,
        provider: googleAccount.provider,
        externalAccountId: googleAccount.providerAccountId,
        account: {
          provider: googleAccount.provider,
          type: googleAccount.type,
          providerAccountId: googleAccount.providerAccountId,
          access_token: googleAccount.access_token || '',
          refresh_token: googleAccount.refresh_token || '',
          expires_at: googleAccount.expires_at || undefined,
          token_type: googleAccount.token_type || undefined,
          scope: googleAccount.scope || undefined,
          id_token: googleAccount.id_token || undefined,
        },
        profile: {
          email: user.email!,
          name: user.name || undefined,
          image: user.image || undefined
        }
      });

      console.log('🔧 Manual onboarding result:', onboardingResult);

      return NextResponse.json({
        success: true,
        onboardingResult,
        message: 'Manual onboarding completed'
      });

    } catch (onboardingError) {
      console.error('❌ Manual onboarding failed:', onboardingError);
      return NextResponse.json({
        error: 'Onboarding failed',
        details: onboardingError instanceof Error ? onboardingError.message : String(onboardingError),
        stack: onboardingError instanceof Error ? onboardingError.stack : undefined
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Manual onboarding endpoint failed:', error);
    return NextResponse.json({ 
      error: 'Endpoint failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Show users without organizations
    const usersWithoutOrgs = await prisma.user.findMany({
      where: {
        orgMembers: {
          none: {}
        }
      },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true
          }
        },
        _count: {
          select: {
            orgMembers: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      usersWithoutOrgs: usersWithoutOrgs.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        accounts: user.accounts,
        orgMembersCount: user._count.orgMembers
      })),
      message: 'POST with userEmail to trigger manual onboarding'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Status check failed',
      details: error instanceof Error ? error.message : String(error)  
    }, { status: 500 });
  }
}