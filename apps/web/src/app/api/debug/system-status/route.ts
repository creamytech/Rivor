import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export async function GET(req: NextRequest) {
  try {
    console.log('🏥 Checking system status');
    
    const startTime = Date.now();
    
    // Test 1: Authentication
    let authStatus = 'unknown';
    let sessionData = null;
    try {
      const session = await auth();
      authStatus = session ? 'authenticated' : 'not_authenticated';
      sessionData = session ? {
        userId: session.user?.id,
        userEmail: session.user?.email,
        userName: session.user?.name
      } : null;
    } catch (error) {
      authStatus = 'error';
    }

    // Test 2: Database connection
    let dbStatus = 'unknown';
    let dbStats = null;
    try {
      const userCount = await prisma.user.count();
      const orgCount = await prisma.org.count();
      const emailAccountCount = await prisma.emailAccount.count();
      const calendarAccountCount = await prisma.calendarAccount.count();
      
      dbStatus = 'connected';
      dbStats = {
        users: userCount,
        organizations: orgCount,
        emailAccounts: emailAccountCount,
        calendarAccounts: calendarAccountCount
      };
    } catch (error) {
      dbStatus = 'error';
    }

    // Test 3: User onboarding state (if authenticated)
    let onboardingStatus = 'n/a';
    let userData = null;
    if (authStatus === 'authenticated' && sessionData?.userEmail) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: sessionData.userEmail },
          include: {
            orgMembers: {
              include: { org: true }
            },
            emailAccounts: true,
            calendarAccounts: true,
            accounts: true
          }
        });

        if (user) {
          const hasOrg = user.orgMembers.length > 0;
          const hasEmailAccount = user.emailAccounts.length > 0;
          const hasNextAuthAccount = user.accounts.length > 0;
          
          onboardingStatus = hasOrg && hasEmailAccount ? 'complete' : 'incomplete';
          userData = {
            userId: user.id,
            email: user.email,
            createdAt: user.createdAt,
            hasOrg,
            orgId: user.orgMembers[0]?.orgId || null,
            hasEmailAccount,
            hasCalendarAccount: user.calendarAccounts.length > 0,
            hasNextAuthAccount,
            emailAccountStatuses: user.emailAccounts.map(acc => ({
              provider: acc.provider,
              status: acc.status,
              tokenStatus: acc.tokenStatus
            }))
          };
        } else {
          onboardingStatus = 'no_user_record';
        }
      } catch (error) {
        onboardingStatus = 'error';
      }
    }

    // Test 4: Environment check
    const envStatus = {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV
    };

    const totalTime = Date.now() - startTime;
    
    // Overall health score
    const healthScore = [
      authStatus === 'authenticated' ? 25 : 0,
      dbStatus === 'connected' ? 25 : 0,
      onboardingStatus === 'complete' ? 25 : (onboardingStatus === 'incomplete' ? 15 : 0),
      (envStatus.hasNextAuthSecret && envStatus.hasGoogleClientId && envStatus.hasGoogleClientSecret && envStatus.hasDatabaseUrl) ? 25 : 0
    ].reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: true,
      healthScore,
      status: healthScore >= 75 ? 'healthy' : healthScore >= 50 ? 'degraded' : 'unhealthy',
      checks: {
        authentication: {
          status: authStatus,
          session: sessionData
        },
        database: {
          status: dbStatus,
          stats: dbStats
        },
        onboarding: {
          status: onboardingStatus,
          user: userData
        },
        environment: envStatus
      },
      performance: {
        totalCheckTime: totalTime,
        timestamp: new Date().toISOString()
      },
      recommendations: [
        ...(authStatus !== 'authenticated' ? ['Sign in to check user-specific status'] : []),
        ...(dbStatus !== 'connected' ? ['Check database connection'] : []),
        ...(onboardingStatus === 'incomplete' ? ['Complete user onboarding'] : []),
        ...(onboardingStatus === 'no_user_record' ? ['User record missing - run onboarding'] : []),
        ...(!envStatus.hasNextAuthSecret ? ['Set NEXTAUTH_SECRET'] : []),
        ...(!envStatus.hasGoogleClientId ? ['Set GOOGLE_CLIENT_ID'] : []),
        ...(!envStatus.hasGoogleClientSecret ? ['Set GOOGLE_CLIENT_SECRET'] : []),
        ...(!envStatus.hasDatabaseUrl ? ['Set DATABASE_URL'] : [])
      ]
    });
    
  } catch (error) {
    console.error('❌ System status check failed:', error);
    
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}