import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Checking onboarding status');
    
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated session',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // Check if user has org, email account, calendar account
    const user = await prisma.user.findUnique({
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
        emailAccounts: true,
        accounts: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasOrg: user.orgMembers.length > 0,
        orgId: user.orgMembers[0]?.orgId || null,
        orgName: user.orgMembers[0]?.org?.name || null,
        emailAccountsCount: user.emailAccounts.length,
        calendarAccountsCount: user.orgMembers[0]?.org?.calendarAccounts?.length || 0,
        nextAuthAccountsCount: user.accounts.length,
        emailAccounts: user.emailAccounts.map(acc => ({
          id: acc.id,
          provider: acc.provider,
          email: acc.email,
          status: acc.status,
          tokenStatus: acc.tokenStatus,
          encryptionStatus: acc.encryptionStatus
        })),
        nextAuthAccounts: user.accounts.map(acc => ({
          id: acc.id,
          provider: acc.provider,
          providerAccountId: acc.providerAccountId,
          type: acc.type,
          hasAccessToken: !!acc.access_token,
          hasRefreshToken: !!acc.refresh_token
        }))
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Check onboarding failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}