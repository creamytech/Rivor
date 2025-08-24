import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createKmsClient, generateDek } from '@rivor/crypto';
import { logOAuth } from '@/lib/oauth-logger';

export async function GET(req: NextRequest) {
  return POST(req); // Allow GET for convenience
}

export async function POST(req: NextRequest) {
  try {
    logOAuth('info', '🔧 Fixing organization DEK for KMS encryption');
    
    // Find all existing orgs that might be problematic
    const existingOrgs = await prisma.org.findMany({
      where: { 
        OR: [
          { id: 'dev-org-1' },
          { id: 'default' },
          { name: 'dev@test.com' },
          { name: 'Default Organization' }
        ]
      }
    });

    if (existingOrgs.length > 0) {
      logOAuth('info', '🗑️ Deleting existing organizations', {
        count: existingOrgs.length,
        orgs: existingOrgs.map(org => ({ id: org.id, name: org.name }))
      });
      
      // Delete all existing orgs
      for (const org of existingOrgs) {
        await prisma.org.delete({
          where: { id: org.id }
        });
      }
    }

    // Create KMS client and generate fresh DEK
    logOAuth('info', '🔑 Generating new DEK with KMS');
    const kmsProvider = (process.env.KMS_PROVIDER as any) || 'local';
    const kmsKeyId = process.env.KMS_KEY_ID;
    const kmsClient = createKmsClient(kmsProvider, kmsKeyId);
    
    // Generate a fresh DEK and encrypt it with KMS
    const plaintextDek = generateDek(); // This creates a 32-byte DEK
    const encryptedDekBlob = await kmsClient.encryptDek(plaintextDek);
    const dekVersion = 1;

    // Create new default organization with proper DEK
    logOAuth('info', '🏢 Creating new default organization with valid DEK');
    const newOrg = await prisma.org.create({
      data: {
        id: 'default',
        name: 'Default Organization',
        slug: 'default',
        encryptedDekBlob: Buffer.from(encryptedDekBlob),
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