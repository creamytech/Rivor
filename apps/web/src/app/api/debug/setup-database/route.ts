import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-pool';
import { generateDek, createKmsClient } from '@rivor/crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log('🌱 Starting database setup...');

    const results = [];

    // 1. Check if default organization exists, create if needed
    let defaultOrg = await prisma.org.findFirst();
    
    if (!defaultOrg) {
      console.log('📦 Creating default organization...');
      
      try {
        // Generate DEK for the organization
        const kmsClient = createKmsClient();
        const { encryptedDekBlob, dekVersion } = await generateDek(kmsClient);

        defaultOrg = await prisma.org.create({
          data: {
            name: 'Default Organization',
            slug: 'default',
            brandName: 'Rivor',
            encryptedDekBlob,
            dekVersion,
            ephemeralMode: false,
            retentionDays: 90,
          },
        });

        results.push({ 
          type: 'Organization', 
          id: defaultOrg.id, 
          created: true,
          name: defaultOrg.name
        });
      } catch (orgError) {
        console.error('❌ Failed to create organization:', orgError);
        results.push({ 
          type: 'Organization', 
          created: false, 
          error: orgError.message 
        });
      }
    } else {
      results.push({ 
        type: 'Organization', 
        id: defaultOrg.id, 
        created: false, 
        message: 'Already exists',
        name: defaultOrg.name
      });
    }

    // 2. Verify database schema
    console.log('🔍 Verifying database schema...');
    
    try {
      // Check Account table has encrypted columns
      const accountColumns = await prisma.$queryRaw<Array<{column_name: string, data_type: string}>>`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Account' 
        AND table_schema = 'public'
        AND column_name IN ('access_token_enc', 'refresh_token_enc', 'id_token_enc')
        ORDER BY column_name;
      `;

      const hasEncryptedTokens = accountColumns.length === 3;
      
      results.push({
        type: 'Schema',
        action: 'verified',
        encryptedTokenColumns: accountColumns.length,
        hasEncryptedTokens,
        columns: accountColumns.map(col => col.column_name)
      });
    } catch (schemaError) {
      results.push({
        type: 'Schema',
        action: 'error',
        error: schemaError.message
      });
    }

    // 3. Database statistics
    const stats = {
      users: await prisma.user.count(),
      accounts: await prisma.account.count(),
      orgs: await prisma.org.count(),
      emailAccounts: await prisma.emailAccount.count(),
      calendarAccounts: await prisma.calendarAccount.count(),
    };

    results.push({
      type: 'Statistics',
      ...stats
    });

    // 4. Environment validation
    const requiredEnvVars = [
      'DATABASE_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'NEXTAUTH_SECRET',
      'KMS_KEY_ID'
    ];
    
    const envStatus = requiredEnvVars.map(varName => ({
      name: varName,
      present: !!process.env[varName],
      length: process.env[varName]?.length || 0
    }));

    const missingEnv = envStatus.filter(env => !env.present);
    
    results.push({
      type: 'Environment',
      totalVars: requiredEnvVars.length,
      presentVars: envStatus.filter(env => env.present).length,
      missingVars: missingEnv.map(env => env.name),
      allPresent: missingEnv.length === 0
    });

    console.log('✅ Database setup completed');

    return NextResponse.json({
      success: true,
      message: 'Database setup completed',
      results,
      summary: {
        orgReady: !!defaultOrg,
        orgId: defaultOrg?.id,
        orgName: defaultOrg?.name,
        databaseStats: stats,
        environmentReady: missingEnv.length === 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}