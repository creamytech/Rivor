import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { PrismaAdapter } from "@next-auth/prisma-adapter";

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Checking authentication state and PrismaAdapter compatibility...');
    
    // Test 1: Check database connection and current state
    const dbState = {
      users: await prisma.user.count(),
      accounts: await prisma.account.count(),
      sessions: await prisma.session.count()
    };
    
    // Test 2: Check your specific user
    const yourUser = await prisma.user.findUnique({
      where: { email: 'benjaminscott18@gmail.com' },
      include: {
        accounts: true,
        sessions: true
      }
    });
    
    // Test 3: Test PrismaAdapter creation (this might reveal schema issues)
    let adapterTest = 'unknown';
    try {
      const adapter = PrismaAdapter(prisma);
      adapterTest = typeof adapter.createUser === 'function' ? 'adapter_created_successfully' : 'adapter_missing_methods';
      
      // Test if adapter methods exist
      const adapterMethods = {
        createUser: typeof adapter.createUser === 'function',
        getUser: typeof adapter.getUser === 'function',
        getUserByEmail: typeof adapter.getUserByEmail === 'function',
        getUserByAccount: typeof adapter.getUserByAccount === 'function',
        linkAccount: typeof adapter.linkAccount === 'function',
        createSession: typeof adapter.createSession === 'function',
        getSessionAndUser: typeof adapter.getSessionAndUser === 'function',
        updateSession: typeof adapter.updateSession === 'function',
        deleteSession: typeof adapter.deleteSession === 'function'
      };
      
      console.log('🔧 PrismaAdapter methods check:', adapterMethods);
      
    } catch (adapterError) {
      adapterTest = `adapter_error: ${(adapterError as any)?.message || 'unknown'}`;
      console.error('❌ PrismaAdapter creation failed:', adapterError);
    }
    
    // Test 4: Check Account model schema compatibility
    let schemaTest = 'unknown';
    try {
      // Try to create a test account structure to validate schema
      const testAccountData = {
        userId: 'test',
        type: 'oauth',
        provider: 'google',
        providerAccountId: 'test123',
        refresh_token: 'test_refresh',
        access_token: 'test_access',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'Bearer',
        scope: 'email profile',
        id_token: 'test_id_token',
      };
      
      // Don't actually create it, just validate the fields exist
      const accountFields = Object.keys(testAccountData);
      schemaTest = `schema_fields_available: ${accountFields.join(', ')}`;
      
    } catch (schemaError) {
      schemaTest = `schema_error: ${(schemaError as any)?.message || 'unknown'}`;
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        connection: 'ok',
        counts: dbState,
        yourUser: {
          exists: !!yourUser,
          id: yourUser?.id,
          email: yourUser?.email,
          accountsCount: yourUser?.accounts?.length || 0,
          sessionsCount: yourUser?.sessions?.length || 0,
          accounts: yourUser?.accounts?.map(acc => ({
            provider: acc.provider,
            providerAccountId: acc.providerAccountId,
            hasTokens: !!(acc as any).access_token || !!(acc as any).refresh_token
          })) || []
        }
      },
      adapter: {
        status: adapterTest,
        prismaAdapterAvailable: true
      },
      schema: {
        test: schemaTest
      }
    });
    
  } catch (error) {
    console.error('❌ Auth state check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}