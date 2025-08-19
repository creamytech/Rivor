import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { decryptForOrg, encryptForOrg } from '@/server/crypto';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Debug session information
    const sessionInfo = {
      userEmail: session.user.email,
      orgId: session.user.orgId,
      hasOrgId: !!session.user.orgId,
      sessionKeys: Object.keys(session.user || {})
    };

    // Try to get orgId from database if not in session
    let orgId = session.user.orgId;
    if (!orgId) {
      logger.info('No orgId in session, looking up from database', {
        userId: session.user.email
      });
      const org = await prisma.org.findFirst({ 
        where: { name: session.user.email } 
      });
      if (org) {
        orgId = org.id;
        logger.info('Found orgId from database', { orgId });
      } else {
        return NextResponse.json({
          success: false,
          message: 'No organization found in database',
          sessionInfo,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Test basic encryption/decryption functionality
    const encryptionTest = {
      success: false,
      error: null,
      testData: 'test-encryption-data',
      encryptedLength: 0,
      decryptedData: null,
      dataMatches: false
    };

    try {
      const testData = 'test-encryption-data';
      const encrypted = await encryptForOrg(orgId, testData, 'test:context');
      const decrypted = await decryptForOrg(orgId, encrypted, 'test:context');
      const decryptedText = new TextDecoder().decode(decrypted);
      
      encryptionTest.success = true;
      encryptionTest.encryptedLength = encrypted.length;
      encryptionTest.decryptedData = decryptedText;
      encryptionTest.dataMatches = decryptedText === testData;
    } catch (encryptError) {
      encryptionTest.error = `Encryption test failed: ${encryptError instanceof Error ? encryptError.message : 'Unknown error'}`;
    }

    // Test OAuth token encryption/decryption specifically
    const oauthTest = {
      success: false,
      error: null,
      testToken: 'test-oauth-token-12345',
      encryptedLength: 0,
      decryptedToken: null,
      tokenMatches: false
    };

    try {
      const testToken = 'test-oauth-token-12345';
      const encrypted = await encryptForOrg(orgId, testToken, 'oauth:access');
      const decrypted = await decryptForOrg(orgId, encrypted, 'oauth:access');
      const decryptedText = new TextDecoder().decode(decrypted);
      
      oauthTest.success = true;
      oauthTest.encryptedLength = encrypted.length;
      oauthTest.decryptedToken = decryptedText;
      oauthTest.tokenMatches = decryptedText === testToken;
    } catch (oauthError) {
      oauthTest.error = `OAuth encryption test failed: ${oauthError instanceof Error ? oauthError.message : 'Unknown error'}`;
    }

    // Get secure tokens with metadata
    const secureTokens = await prisma.secureToken.findMany({
      where: {
        orgId,
        provider: 'google',
        encryptionStatus: 'ok'
      },
      select: {
        id: true,
        tokenType: true,
        encryptedTokenBlob: true,
        encryptionStatus: true,
        createdAt: true,
        updatedAt: true,
        orgId: true,
        provider: true
      }
    });

    if (secureTokens.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No secure tokens found',
        orgId,
        sessionInfo,
        encryptionTest,
        oauthTest,
        timestamp: new Date().toISOString()
      });
    }

    const results = [];
    
    for (const token of secureTokens) {
      try {
        let decryptedToken = null;
        let error = null;
        let successfulContext = null;

        if (token.encryptedTokenBlob) {
          // Test multiple possible decryption contexts
          const contextsToTest = [
            `oauth:${token.tokenType === 'oauth_access' ? 'access' : 'refresh'}`,
            `oauth:${token.tokenType === 'oauth_access' ? 'access' : 'refresh'}:${session.user.email}`,
            `oauth:${token.tokenType === 'oauth_access' ? 'access' : 'refresh'}:google`,
            `oauth:${token.tokenType === 'oauth_access' ? 'access' : 'refresh'}:${orgId}`,
            `oauth:${token.tokenType}`,
            `oauth:${token.tokenType}:${session.user.email}`,
            `oauth:${token.tokenType}:google`,
            `oauth:${token.tokenType}:${orgId}`,
            `token:${token.tokenType}`,
            `token:${token.tokenType}:${session.user.email}`,
            `token:${token.tokenType}:google`,
            `token:${token.tokenType}:${orgId}`,
            `google:${token.tokenType}`,
            `google:${token.tokenType}:${session.user.email}`,
            `google:${token.tokenType}:${orgId}`,
            `${token.tokenType}`,
            `${token.tokenType}:${session.user.email}`,
            `${token.tokenType}:google`,
            `${token.tokenType}:${orgId}`,
          ];

          for (const context of contextsToTest) {
            try {
              const decryptedBytes = await decryptForOrg(
                orgId,
                token.encryptedTokenBlob,
                context
              );
              const testDecrypted = new TextDecoder().decode(decryptedBytes);
              
              // Basic validation that it looks like a token
              if (testDecrypted && testDecrypted.length > 10 && !testDecrypted.includes('\0')) {
                decryptedToken = testDecrypted;
                successfulContext = context;
                break;
              }
            } catch (contextError) {
              // Continue to next context
            }
          }

          if (!decryptedToken) {
            error = `Decryption failed for all tested contexts. Tried: ${contextsToTest.slice(0, 5).join(', ')}...`;
          }
        }

        results.push({
          tokenId: token.id,
          tokenType: token.tokenType,
          hasEncryptedBlob: !!token.encryptedTokenBlob,
          encryptedBlobLength: token.encryptedTokenBlob?.length || 0,
          createdAt: token.createdAt,
          updatedAt: token.updatedAt,
          encryptionStatus: token.encryptionStatus,
          decryptedToken: decryptedToken ? `${decryptedToken.substring(0, 20)}...` : null,
          successfulContext,
          error,
          status: error ? 'failed' : 'success'
        });
      } catch (tokenError) {
        results.push({
          tokenId: token.id,
          tokenType: token.tokenType,
          hasEncryptedBlob: !!token.encryptedTokenBlob,
          encryptedBlobLength: token.encryptedTokenBlob?.length || 0,
          createdAt: token.createdAt,
          updatedAt: token.updatedAt,
          encryptionStatus: token.encryptionStatus,
          decryptedToken: null,
          successfulContext: null,
          error: `Token processing failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`,
          status: 'failed'
        });
      }
    }

    return NextResponse.json({
      success: true,
      orgId,
      sessionInfo,
      encryptionTest,
      oauthTest,
      totalTokens: secureTokens.length,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Token decryption test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
