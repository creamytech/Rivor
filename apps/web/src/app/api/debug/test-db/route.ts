import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Testing database connection...');

    // Test basic connection
    const dbTest = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database connected:', dbTest);

    // Test User creation
    const testEmail = `test-${Date.now()}@example.com`;
    console.log('👤 Testing User creation...');
    
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
        emailVerified: new Date()
      }
    });
    console.log('✅ User created:', testUser.id);

    // Test Account creation
    console.log('🔗 Testing Account creation...');
    const testAccount = await prisma.account.create({
      data: {
        userId: testUser.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: 'test-123',
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'Bearer',
        scope: 'openid email profile'
      }
    });
    console.log('✅ Account created:', testAccount.id);

    // Test Session creation  
    console.log('📱 Testing Session creation...');
    const testSession = await prisma.session.create({
      data: {
        userId: testUser.id,
        sessionToken: `test-session-${Date.now()}`,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });
    console.log('✅ Session created:', testSession.id);

    // Cleanup
    await prisma.session.delete({ where: { id: testSession.id } });
    await prisma.account.delete({ where: { id: testAccount.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('🧹 Cleaned up test records');

    return NextResponse.json({
      success: true,
      message: 'All database operations successful',
      tests: {
        connection: 'OK',
        userCreation: 'OK', 
        accountCreation: 'OK',
        sessionCreation: 'OK',
        cleanup: 'OK'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: {
        name: error.name,
        code: error.code,
        meta: error.meta
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}