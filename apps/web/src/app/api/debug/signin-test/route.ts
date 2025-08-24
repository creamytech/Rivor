import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/server/auth';
import { prisma } from '@/server/db';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Testing sign-in configuration...');
    
    // Test 1: Check OAuth providers
    const providers = authOptions.providers || [];
    const providerInfo = providers.map((provider: any) => ({
      id: provider.id,
      name: provider.name,
      type: provider.type,
      hasClientId: !!(provider.options?.clientId || provider.clientId),
      hasClientSecret: !!(provider.options?.clientSecret || provider.clientSecret),
      authUrl: provider.authorization?.url || 'default'
    }));

    // Test 2: Check database connection
    let dbStatus = 'unknown';
    let userCount = 0;
    let accountCount = 0;
    try {
      userCount = await prisma.user.count();
      accountCount = await prisma.account.count();
      dbStatus = 'connected';
    } catch (dbError) {
      dbStatus = `error: ${(dbError as any)?.message || 'unknown'}`;
    }

    // Test 3: Check environment variables
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV
    };

    // Test 4: Check custom adapter
    let adapterTest = 'unknown';
    try {
      const adapter = authOptions.adapter;
      if (adapter) {
        adapterTest = typeof adapter.linkAccount === 'function' ? 'custom_adapter_loaded' : 'default_adapter';
      } else {
        adapterTest = 'no_adapter';
      }
    } catch (adapterError) {
      adapterTest = `error: ${(adapterError as any)?.message || 'unknown'}`;
    }

    return NextResponse.json({
      success: true,
      tests: {
        providers: {
          count: providers.length,
          details: providerInfo
        },
        database: {
          status: dbStatus,
          userCount,
          accountCount
        },
        environment: envCheck,
        adapter: adapterTest,
        authOptions: {
          hasSecret: !!authOptions.secret,
          sessionStrategy: authOptions.session?.strategy || 'jwt',
          debug: authOptions.debug,
          pages: authOptions.pages
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Sign-in test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}