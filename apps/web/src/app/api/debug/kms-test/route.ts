import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { createKmsClient } from '@rivor/crypto';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(__request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const orgId = (session as { orgId?: string }).orgId;

    if (!orgId || orgId === 'unknown') {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    // Get organization to check KMS setup
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        encryptedDekBlob: true,
        createdAt: true
      }
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Test KMS configuration
    const kmsProvider = process.env.KMS_PROVIDER as 'gcp' | 'aws' | 'azure' | undefined;
    const kmsKeyId = process.env.KMS_KEY_ID;
    const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    // Test KMS client creation
    let kmsClient;
    let kmsClientError;
    try {
      kmsClient = createKmsClient(kmsProvider, kmsKeyId);
    } catch (error: any) {
      kmsClientError = error.message;
    }

    // Test encryption/decryption if client created successfully
    let encryptionTest;
    if (kmsClient && !kmsClientError) {
      try {
        const testData = new TextEncoder().encode('test-encryption-data');
        const encrypted = await kmsClient.encryptDek(testData);
        const decrypted = await kmsClient.decryptDek(encrypted);
        const decryptedText = new TextDecoder().decode(decrypted);
        
        encryptionTest = {
          success: true,
          originalData: 'test-encryption-data',
          decryptedData: decryptedText,
          dataMatches: decryptedText === 'test-encryption-data',
          encryptedLength: encrypted.length
        };
      } catch (error: any) {
        encryptionTest = {
          success: false,
          error: error.message
        };
      }
    }

    // Check SecureToken records
    const secureTokens = await prisma.secureToken.findMany({
      where: { orgId },
      select: {
        id: true,
        tokenRef: true,
        provider: true,
        tokenType: true,
        encryptionStatus: true,
        expiresAt: true,
        createdAt: true,
        encryptedTokenBlob: true
      }
    });

    // Check EmailAccount records
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        provider: true,
        email: true,
        tokenRef: true,
        tokenStatus: true,
        encryptionStatus: true,
        status: true,
        kmsErrorCode: true,
        kmsErrorAt: true
      }
    });

    return NextResponse.json({
      userEmail,
      orgId,
      organization: {
        id: org.id,
        name: org.name,
        hasEncryptedDek: !!org.encryptedDekBlob,
        encryptedDekLength: org.encryptedDekBlob?.length || 0,
        createdAt: org.createdAt
      },
      kmsConfiguration: {
        provider: kmsProvider,
        keyId: kmsKeyId,
        keyIdFormat: kmsKeyId?.startsWith('projects/') ? 'gcp-resource' : 'unknown',
        hasCredentials: !!credsJson,
        credentialsLength: credsJson?.length || 0
      },
      kmsClient: {
        created: !kmsClientError,
        error: kmsClientError
      },
      encryptionTest,
      secureTokens: {
        total: secureTokens.length,
        byStatus: secureTokens.reduce((acc, token) => {
          acc[token.encryptionStatus] = (acc[token.encryptionStatus] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byType: secureTokens.reduce((acc, token) => {
          acc[token.tokenType] = (acc[token.tokenType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        details: secureTokens.map(token => ({
          id: token.id,
          tokenRef: token.tokenRef,
          provider: token.provider,
          tokenType: token.tokenType,
          encryptionStatus: token.encryptionStatus,
          hasEncryptedBlob: !!token.encryptedTokenBlob,
          encryptedBlobLength: token.encryptedTokenBlob?.length || 0,
          expiresAt: token.expiresAt,
          createdAt: token.createdAt
        }))
      },
      emailAccounts: {
        total: emailAccounts.length,
        byStatus: emailAccounts.reduce((acc, account) => {
          acc[account.status] = (acc[account.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byTokenStatus: emailAccounts.reduce((acc, account) => {
          acc[account.tokenStatus] = (acc[account.tokenStatus] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        details: emailAccounts
      },
      diagnosis: {
        hasKmsClient: !kmsClientError,
        hasEncryptionTest: encryptionTest?.success || false,
        hasSecureTokens: secureTokens.length > 0,
        hasEmailAccounts: emailAccounts.length > 0,
        tokensWithErrors: secureTokens.filter(t => t.encryptionStatus === 'error').length,
        accountsWithErrors: emailAccounts.filter(a => a.kmsErrorCode).length,
        possibleIssues: []
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Failed to test KMS', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: "Failed to test KMS", details: error.message }, { status: 500 });
  }
}
