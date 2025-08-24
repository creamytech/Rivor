import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(req: NextRequest) {
  try {
    console.log('🔌 Testing database connection...');
    
    // Simple connection test - just count users
    const userCount = await prisma.user.count();
    const accountCount = await prisma.account.count();
    const orgCount = await prisma.org.count();
    
    // Test if we can read from accounts table with encrypted fields
    const sampleAccount = await prisma.account.findFirst({
      select: {
        id: true,
        provider: true,
        access_token_enc: true,
        refresh_token_enc: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({
      success: true,
      connection: 'healthy',
      counts: {
        users: userCount,
        accounts: accountCount,
        orgs: orgCount
      },
      sampleAccount: sampleAccount ? {
        id: sampleAccount.id,
        provider: sampleAccount.provider,
        hasEncryptedTokens: {
          access: !!sampleAccount.access_token_enc,
          refresh: !!sampleAccount.refresh_token_enc
        },
        createdAt: sampleAccount.createdAt
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    return NextResponse.json({
      success: false,
      connection: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as any)?.code || 'UNKNOWN',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}