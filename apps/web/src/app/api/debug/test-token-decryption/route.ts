import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { decryptForOrg } from '@/server/crypto';
import { logger } from '@/lib/logger';

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

    const orgId = session.user.orgId;
    if (!orgId) {
      return NextResponse.json({
        success: false,
        message: 'No organization found in session',
        sessionInfo,
        timestamp: new Date().toISOString()
      });
    }

    // Get secure tokens
    const secureTokens = await prisma.secureToken.findMany({
      where: {
        orgId,
        provider: 'google',
        encryptionStatus: 'ok'
      }
    });

    if (secureTokens.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No secure tokens found',
        orgId,
        sessionInfo,
        timestamp: new Date().toISOString()
      });
    }

    const results = [];
    
    for (const token of secureTokens) {
      try {
        let decryptedToken = null;
        let error = null;

        if (token.encryptedTokenBlob) {
          try {
            const decryptedBytes = await decryptForOrg(
              orgId,
              token.encryptedTokenBlob,
              `oauth:${token.tokenType === 'oauth_access' ? 'access' : 'refresh'}`
            );
            decryptedToken = new TextDecoder().decode(decryptedBytes);
          } catch (decryptError) {
            error = `Decryption failed: ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`;
          }
        }

        results.push({
          tokenId: token.id,
          tokenType: token.tokenType,
          hasEncryptedBlob: !!token.encryptedTokenBlob,
          encryptedBlobLength: token.encryptedTokenBlob?.length || 0,
          decryptedToken: decryptedToken ? `${decryptedToken.substring(0, 20)}...` : null,
          error,
          status: error ? 'failed' : 'success'
        });
      } catch (tokenError) {
        results.push({
          tokenId: token.id,
          tokenType: token.tokenType,
          hasEncryptedBlob: !!token.encryptedTokenBlob,
          encryptedBlobLength: token.encryptedTokenBlob?.length || 0,
          decryptedToken: null,
          error: `Token processing failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`,
          status: 'failed'
        });
      }
    }

    return NextResponse.json({
      success: true,
      orgId,
      sessionInfo,
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
