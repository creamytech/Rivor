import { google } from 'googleapis';
import { prisma } from './db';
import { decryptForOrg, encryptForOrg } from './crypto';
import { logger } from '@/lib/logger';

export interface TokenValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  error?: string;
  expiresAt?: Date;
  refreshed?: boolean;
}

export interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

/**
 * Validate and refresh Google OAuth tokens
 */
export async function validateGoogleToken(
  orgId: string, 
  oauthAccountId: string
): Promise<TokenValidationResult> {
  const correlationId = `token-val-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('Starting token validation', {
      orgId,
      oauthAccountId,
      correlationId,
      action: 'token_validation_start'
    });

    // Get OAuth account
    const oauthAccount = await prisma.oAuthAccount.findUnique({
      where: { id: oauthAccountId }
    });

    if (!oauthAccount) {
      return {
        isValid: false,
        needsRefresh: false,
        error: 'OAuth account not found'
      };
    }

    // Decrypt tokens
    const tokenInfo = await decryptTokens(orgId, oauthAccount);
    
    // Check if token is expired based on stored expiration
    const now = new Date();
    const isExpiredByTime = oauthAccount.expiresAt && oauthAccount.expiresAt <= now;
    
    if (isExpiredByTime && !tokenInfo.refreshToken) {
      logger.warn('Token expired with no refresh token', {
        correlationId,
        provider: oauthAccount.provider,
        expiresAt: oauthAccount.expiresAt || undefined
      });
      
      return {
        isValid: false,
        needsRefresh: false,
        error: 'Token expired and no refresh token available'
      };
    }

    // Create OAuth2 client for validation
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: tokenInfo.accessToken,
      refresh_token: tokenInfo.refreshToken,
    });

    // Test token validity with a lightweight API call
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      await oauth2.userinfo.get();
      
      logger.info('Token validation successful', {
        correlationId,
        provider: oauthAccount.provider,
        action: 'token_validation_success'
      });

      return {
        isValid: true,
        needsRefresh: false,
        expiresAt: tokenInfo.expiresAt
      };
    } catch (apiError: unknown) {
      // Token invalid - try to refresh if we have a refresh token
      if (tokenInfo.refreshToken) {
        logger.info('Token invalid, attempting refresh', {
          correlationId,
          error: apiError.message,
          action: 'token_refresh_attempt'
        });

        return await refreshGoogleToken(orgId, oauthAccount, oauth2Client, correlationId);
      } else {
        logger.error('Token invalid with no refresh token', {
          correlationId,
          error: apiError.message,
          action: 'token_validation_failed'
        });

        return {
          isValid: false,
          needsRefresh: false,
          error: `Token invalid: ${apiError.message}`
        };
      }
    }
  } catch (error: unknown) {
    logger.error('Token validation error', {
      correlationId,
      error: error.message,
      action: 'token_validation_error'
    });

    return {
      isValid: false,
      needsRefresh: false,
      error: `Validation error: ${error.message}`
    };
  }
}

/**
 * Refresh Google OAuth token
 */
async function refreshGoogleToken(
  orgId: string,
  oauthAccount: unknown,
  oauth2Client: unknown,
  correlationId: string
): Promise<TokenValidationResult> {
  try {
    // Attempt token refresh
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('No access token returned from refresh');
    }

    // Encrypt new tokens
    const accessTokenEnc = await encryptForOrg(orgId, credentials.access_token, 'oauth:access');
    const refreshTokenEnc = credentials.refresh_token 
      ? await encryptForOrg(orgId, credentials.refresh_token, 'oauth:refresh')
      : oauthAccount.refreshToken; // Keep existing refresh token if not provided

    // Update database
    await prisma.oAuthAccount.update({
      where: { id: oauthAccount.id },
      data: {
        accessToken: accessTokenEnc,
        refreshToken: refreshTokenEnc,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        updatedAt: new Date()
      }
    });

    logger.info('Token refresh successful', {
      correlationId,
      provider: oauthAccount.provider,
      expiresAt: credentials.expiry_date,
      action: 'token_refresh_success'
    });

    return {
      isValid: true,
      needsRefresh: false,
      expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
      refreshed: true
    };
  } catch (refreshError: unknown) {
    logger.error('Token refresh failed', {
      correlationId,
      error: refreshError.message,
      action: 'token_refresh_failed'
    });

    return {
      isValid: false,
      needsRefresh: true,
      error: `Refresh failed: ${refreshError.message}`
    };
  }
}

/**
 * Decrypt OAuth tokens from database
 */
async function decryptTokens(orgId: string, oauthAccount: unknown): Promise<TokenInfo> {
  const accessTokenBytes = await decryptForOrg(orgId, oauthAccount.accessToken, 'oauth:access');
  const accessToken = new TextDecoder().decode(accessTokenBytes);
  
  let refreshToken: string | undefined;
  if (oauthAccount.refreshToken.length > 0) {
    const refreshTokenBytes = await decryptForOrg(orgId, oauthAccount.refreshToken, 'oauth:refresh');
    refreshToken = new TextDecoder().decode(refreshTokenBytes);
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: oauthAccount.expiresAt || undefined
  };
}

/**
 * Create a Google OAuth2 client with automatic token refresh
 */
export async function createGoogleOAuthClient(orgId: string, oauthAccountId: string) {
  const oauthAccount = await prisma.oAuthAccount.findUnique({
    where: { id: oauthAccountId }
  });

  if (!oauthAccount) {
    throw new Error('OAuth account not found');
  }

  const tokenInfo = await decryptTokens(orgId, oauthAccount);
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: tokenInfo.accessToken,
    refresh_token: tokenInfo.refreshToken,
  });

  // Set up automatic token refresh
  oauth2Client.on('tokens', async (tokens) => {
    try {
      if (tokens.access_token) {
        const accessTokenEnc = await encryptForOrg(orgId, tokens.access_token, 'oauth:access');
        
        const updateData: unknown = {
          accessToken: accessTokenEnc,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          updatedAt: new Date()
        };

        if (tokens.refresh_token) {
          const refreshTokenEnc = await encryptForOrg(orgId, tokens.refresh_token, 'oauth:refresh');
          updateData.refreshToken = refreshTokenEnc;
        }

        await prisma.oAuthAccount.update({
          where: { id: oauthAccount.id },
          data: updateData
        });

        logger.info('Tokens auto-refreshed', {
          provider: oauthAccount.provider,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
          action: 'token_auto_refresh'
        });
      }
    } catch (error) {
      logger.error('Failed to save refreshed tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
        action: 'token_save_failed'
      });
    }
  });

  return oauth2Client;
}

/**
 * Validate tokens for all Google accounts for a user
 */
export async function validateAllGoogleTokens(userEmail: string): Promise<Record<string, TokenValidationResult>> {
  const accounts = await prisma.oAuthAccount.findMany({
    where: {
      userId: userEmail,
      provider: 'google'
    }
  });

  const results: Record<string, TokenValidationResult> = {};

  for (const account of accounts) {
    // Find the org for this account
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        orgMembers: {
          include: { org: true }
        }
      }
    });

    if (user?.orgMembers?.[0]?.org) {
      const orgId = user.orgMembers[0].org.id;
      results[account.id] = await validateGoogleToken(orgId, account.id);
    }
  }

  return results;
}
