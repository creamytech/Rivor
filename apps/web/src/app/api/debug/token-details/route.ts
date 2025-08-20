import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
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

    // Get organization DEK
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        encryptedDekBlob: true
      }
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Get SecureToken records
    const secureTokens = await prisma.secureToken.findMany({
      where: { orgId },
      select: {
        id: true,
        tokenRef: true,
        provider: true,
        tokenType: true,
        encryptionStatus: true,
        encryptedTokenBlob: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Test decryption of each token
    const kmsClient = createKmsClient(
      process.env.KMS_PROVIDER as 'gcp' | 'aws' | 'azure' | undefined,
      process.env.KMS_KEY_ID
    );

    const tokenTests = await Promise.all(
      secureTokens.map(async (token) => {
        let decryptionTest = null;
        
        if (token.encryptedTokenBlob) {
          try {
            // Try to decrypt the token
            const decrypted = await kmsClient.decryptDek(token.encryptedTokenBlob);
            decryptionTest = {
              success: true,
              decryptedLength: decrypted.length,
              decryptedPreview: decrypted.slice(0, 20) // First 20 bytes
            };
          } catch (error: any) {
            decryptionTest = {
              success: false,
              error: error.message,
              errorCode: error.code
            };
          }
        }

        return {
          id: token.id,
          tokenRef: token.tokenRef,
          provider: token.provider,
          tokenType: token.tokenType,
          encryptionStatus: token.encryptionStatus,
          hasEncryptedBlob: !!token.encryptedTokenBlob,
          encryptedBlobLength: token.encryptedTokenBlob?.length || 0,
          createdAt: token.createdAt,
          updatedAt: token.updatedAt,
          decryptionTest
        };
      })
    );

    // Test organization DEK decryption
    let orgDekTest = null;
    if (org.encryptedDekBlob) {
      try {
        const decryptedDek = await kmsClient.decryptDek(org.encryptedDekBlob);
        orgDekTest = {
          success: true,
          decryptedLength: decryptedDek.length,
          decryptedPreview: decryptedDek.slice(0, 20)
        };
      } catch (error: any) {
        orgDekTest = {
          success: false,
          error: error.message,
          errorCode: error.code
        };
      }
    }

    return NextResponse.json({
      userEmail,
      orgId,
      organization: {
        id: org.id,
        hasEncryptedDek: !!org.encryptedDekBlob,
        encryptedDekLength: org.encryptedDekBlob?.length || 0,
        dekDecryptionTest: orgDekTest
      },
      secureTokens: {
        total: secureTokens.length,
        tokenTests
      },
      summary: {
        totalTokens: secureTokens.length,
        tokensWithBlob: secureTokens.filter(t => t.encryptedTokenBlob).length,
        successfulDecryptions: tokenTests.filter(t => t.decryptionTest?.success).length,
        failedDecryptions: tokenTests.filter(t => t.decryptionTest && !t.decryptionTest.success).length,
        orgDekDecryptionSuccess: orgDekTest?.success || false
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Failed to get token details', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: "Failed to get token details", details: error.message }, { status: 500 });
  }
}
