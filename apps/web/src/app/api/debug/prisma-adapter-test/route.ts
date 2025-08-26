import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { PrismaAdapter } from "@next-auth/prisma-adapter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'test_oauth_flow', email = 'benjaminscott18@gmail.com' } = body;
    
    console.log(`🧪 Testing PrismaAdapter ${action}...`);
    
    const adapter = PrismaAdapter(prisma);
    const results = [];
    
    if (action === 'clean_user') {
      // Clean up test user
      try {
        await prisma.account.deleteMany({ where: { user: { email } } });
        await prisma.session.deleteMany({ where: { user: { email } } });
        await prisma.user.delete({ where: { email } });
        results.push({ step: 'clean_user', success: true, email });
      } catch (error) {
        results.push({ step: 'clean_user', success: false, error: error instanceof Error ? error.message : error });
      }
    } else if (action === 'test_direct_account_creation') {
      // Test direct account creation without PrismaAdapter
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        try {
          const account = await prisma.account.create({
            data: {
              userId: user.id,
              type: 'oauth',
              provider: 'google',
              providerAccountId: 'direct_test_123',
              access_token: 'test_token',
              refresh_token: 'test_refresh',
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              token_type: 'Bearer',
              scope: 'email profile'
            }
          });
          results.push({ step: 'direct_create_account', success: true, accountId: account.id });
          
          // Clean up
          await prisma.account.delete({ where: { id: account.id } });
        } catch (error) {
          results.push({ step: 'direct_create_account', success: false, error: error instanceof Error ? error.message : error });
        }
      } else {
        results.push({ step: 'direct_create_account', success: false, error: 'User not found' });
      }
    } else if (action === 'test_oauth_flow') {
      // Simulate the OAuth sign-in process that's failing
      const testUser = {
        email: 'benjaminscott18@gmail.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg'
      };
      
      const testAccount = {
        type: 'oauth' as const,
        provider: 'google',
        providerAccountId: 'test_google_id_123',
        refresh_token: 'test_refresh_token_xyz',
        access_token: 'test_access_token_abc',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'Bearer',
        scope: 'email profile openid',
        id_token: 'test_id_token_def'
      };
      
      // Step 1: Check if user exists
      let existingUser = await adapter.getUserByEmail?.(testUser.email);
      results.push({
        step: 'getUserByEmail',
        success: true,
        userExists: !!existingUser,
        userId: existingUser?.id
      });
      
      // Step 2: Create user if doesn't exist (what PrismaAdapter should do)
      if (!existingUser && adapter.createUser) {
        try {
          const createdUser = await adapter.createUser(testUser);
          results.push({
            step: 'createUser',
            success: true,
            userId: createdUser.id,
            userEmail: createdUser.email
          });
          existingUser = createdUser;
        } catch (createUserError) {
          results.push({
            step: 'createUser',
            success: false,
            error: createUserError instanceof Error ? createUserError.message : createUserError
          });
        }
      }
      
      // Step 3: Link account (what PrismaAdapter should do)
      if (existingUser && adapter.linkAccount) {
        try {
          const linkedAccount = await adapter.linkAccount({
            ...testAccount,
            userId: existingUser.id
          });
          results.push({
            step: 'linkAccount',
            success: true,
            accountId: (linkedAccount as any)?.id,
            provider: linkedAccount.provider
          });
        } catch (linkError) {
          results.push({
            step: 'linkAccount',
            success: false,
            error: linkError instanceof Error ? linkError.message : linkError
          });
        }
      }
      
      // Clean up test data
      try {
        if (existingUser) {
          await prisma.account.deleteMany({
            where: { 
              userId: existingUser.id,
              providerAccountId: testAccount.providerAccountId
            }
          });
          
          // Only delete user if we created it for this test
          if (!await prisma.account.findFirst({ where: { userId: existingUser.id } })) {
            await prisma.user.delete({ where: { id: existingUser.id } });
          }
        }
        results.push({
          step: 'cleanup',
          success: true,
          message: 'Test data cleaned up'
        });
      } catch (cleanupError) {
        results.push({
          step: 'cleanup',
          success: false,
          error: cleanupError instanceof Error ? cleanupError.message : cleanupError
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      action,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ PrismaAdapter test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}