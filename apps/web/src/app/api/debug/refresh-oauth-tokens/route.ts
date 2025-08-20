import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { encryptForOrg } from '@/server/crypto';
import { logger } from '@/lib/logger';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get orgId from database if not in session
    let orgId = session.user.orgId;
    if (!orgId) {
      const org = await prisma.org.findFirst({ 
        where: { name: session.user.email } 
      });
      if (org) {
        orgId = org.id;
      } else {
        return NextResponse.json({
          success: false,
          message: 'No organization found in database',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Get existing secure tokens
    const existingTokens = await prisma.secureToken.findMany({
      where: {
        orgId,
        provider: 'google',
        encryptionStatus: 'ok'
      }
    });

    if (existingTokens.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No existing OAuth tokens found to refresh',
        timestamp: new Date().toISOString()
      });
    }

    // Check if we have the necessary tokens
    const refreshTokenRecord = existingTokens.find(t => t.tokenType === 'oauth_refresh');
    const accessTokenRecord = existingTokens.find(t => t.tokenType === 'oauth_access');

    if (!refreshTokenRecord?.encryptedTokenBlob) {
      return NextResponse.json({
        success: false,
        message: 'No refresh token found',
        timestamp: new Date().toISOString()
      });
    }

    const results = [];

    try {
      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
      );

      // Try to refresh tokens using the OAuth account
      const refreshTokenRecord = existingTokens.find(t => t.tokenType === 'oauth_refresh');
      if (!refreshTokenRecord?.encryptedTokenBlob) {
        return NextResponse.json({
          success: false,
          message: 'No refresh token found',
          timestamp: new Date().toISOString()
        });
      }

      // Decrypt refresh token
      const { decryptForOrg } = await import('@/server/crypto');
      const refreshTokenBytes = await decryptForOrg(orgId, refreshTokenRecord.encryptedTokenBlob, 'oauth:refresh');
      const refreshToken = new TextDecoder().decode(refreshTokenBytes);

      // Set refresh token and try to get new access token
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      // Get new tokens
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('Failed to get new access token from Google');
      }

      // Encrypt new tokens with correct context
      const accessTokenEnc = await encryptForOrg(orgId, credentials.access_token, 'oauth:access');
      const refreshTokenEnc = credentials.refresh_token 
        ? await encryptForOrg(orgId, credentials.refresh_token, 'oauth:refresh')
        : refreshTokenRecord.encryptedTokenBlob; // Keep existing if no new refresh token

      // Update tokens in database
      const accessTokenRecord = existingTokens.find(t => t.tokenType === 'oauth_access');
      if (accessTokenRecord) {
        await prisma.secureToken.update({
          where: { id: accessTokenRecord.id },
          data: {
            encryptedTokenBlob: accessTokenEnc,
            updatedAt: new Date()
          }
        });
      }

      if (credentials.refresh_token) {
        await prisma.secureToken.update({
          where: { id: refreshTokenRecord.id },
          data: {
            encryptedTokenBlob: refreshTokenEnc,
            updatedAt: new Date()
          }
        });
      }

      results.push({
        tokenType: 'oauth_access',
        status: 'success',
        message: 'Access token refreshed successfully',
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null
      });

      if (credentials.refresh_token) {
        results.push({
          tokenType: 'oauth_refresh',
          status: 'success',
          message: 'Refresh token updated successfully'
        });
      }

    } catch (refreshError) {
      logger.error('OAuth token refresh failed:', refreshError);
      results.push({
        status: 'failed',
        error: `Token refresh failed: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`,
        suggestion: 'You may need to re-authenticate with Google OAuth'
      });
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'failed').length;

    return NextResponse.json({
      success: successCount > 0,
      message: successCount > 0 ? `Refreshed ${successCount} OAuth tokens successfully` : 'Token refresh failed',
      orgId,
      totalTokens: existingTokens.length,
      successCount,
      failureCount,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('OAuth token refresh failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
