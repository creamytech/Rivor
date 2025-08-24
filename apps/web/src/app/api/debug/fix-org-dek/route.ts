import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createKmsClient, generateDek } from '@rivor/crypto';
import { logOAuth } from '@/lib/oauth-logger';

export async function POST(req: NextRequest) {
  try {
    logOAuth('info', '🔧 Fixing organization DEK for KMS encryption');
    
    // Find the problematic org
    const existingOrg = await prisma.org.findFirst({
      where: { 
        OR: [
          { id: 'dev-org-1' },
          { name: 'dev@test.com' }
        ]
      }
    });

    if (existingOrg) {
      logOAuth('info', '🗑️ Deleting corrupted organization', {
        orgId: existingOrg.id,
        orgName: existingOrg.name
      });
      
      // Delete the corrupted org
      await prisma.org.delete({
        where: { id: existingOrg.id }
      });
    }

    // Create KMS client and generate fresh DEK
    logOAuth('info', '🔑 Generating new DEK with KMS');
    const kmsClient = createKmsClient();
    const { encryptedDekBlob, dekVersion } = await generateDek(kmsClient);

    // Create new default organization with proper DEK
    logOAuth('info', '🏢 Creating new default organization with valid DEK');
    const newOrg = await prisma.org.create({
      data: {
        id: 'default',
        name: 'Default Organization',
        slug: 'default',
        encryptedDekBlob,
        dekVersion,
        ephemeralMode: true,
        retentionDays: 90
      }
    });

    logOAuth('info', '✅ Organization DEK fixed successfully', {
      orgId: newOrg.id,
      dekVersion: newOrg.dekVersion,
      dekSize: encryptedDekBlob.length
    });

    // Test the DEK by trying a simple encryption
    const { encryptForOrg } = await import('@/server/crypto');
    const testData = new TextEncoder().encode('test-encryption');
    const encrypted = await encryptForOrg(newOrg.id, testData, 'test:context');
    
    logOAuth('info', '🧪 DEK encryption test successful', {
      testDataSize: testData.length,
      encryptedSize: encrypted.length
    });

    return NextResponse.json({
      success: true,
      message: 'Organization DEK fixed successfully',
      organization: {
        id: newOrg.id,
        name: newOrg.name,
        dekVersion: newOrg.dekVersion,
        dekBlobSize: encryptedDekBlob.length
      },
      test: {
        encryptionWorking: true,
        testDataSize: testData.length,
        encryptedSize: encrypted.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logOAuth('error', '❌ Failed to fix organization DEK', { 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}