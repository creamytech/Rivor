import { prisma } from "./db";
import { encryptForOrg, decryptForOrg } from "./crypto";
import { logger } from "@/lib/logger";
import { getEnv } from "./env";
import { createKmsClient } from "@rivor/crypto";

export interface TokenData {
  accessToken?: string;
  refreshToken?: string;
  scope?: string;
  expiresAt?: Date;
}

export interface SecureTokenInfo {
  tokenRef: string;
  encryptionStatus: 'ok' | 'pending' | 'failed';
  keyVersion?: number;
  kmsErrorCode?: string;
  kmsErrorAt?: Date;
  expiresAt?: Date;
}

/**
 * Creates a unique token reference key
 */
function generateTokenRef(orgId: string, provider: string, tokenType: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${orgId}-${provider}-${tokenType}-${timestamp}-${random}`;
}

/**
 * Stores tokens securely with KMS encryption, handling failures gracefully
 */
export async function storeTokensSecurely(
  orgId: string,
  provider: string,
  tokenData: TokenData,
  externalAccountId: string
): Promise<SecureTokenInfo[]> {
  const results: SecureTokenInfo[] = [];
  
  try {
    // Store access token
    if (tokenData.accessToken) {
      const tokenRef = generateTokenRef(orgId, provider, 'oauth_access');
      
      try {
        let encryptedBlob: Uint8Array;
        const env = getEnv();
        
        if (env.KMS_PROVIDER && env.KMS_KEY_ID) {
          // Try KMS encryption first
          try {
            encryptedBlob = await encryptForOrg(
              orgId, 
              tokenData.accessToken, 
              `oauth:access:${externalAccountId}`
            );
          } catch (kmsError) {
            logger.warn('KMS encryption failed, falling back to AES-GCM', {
              orgId,
              provider,
              error: (kmsError as unknown)?.message
            });
            
            // Fallback to AES-GCM using NEXTAUTH_SECRET
            encryptedBlob = await encryptWithFallback(tokenData.accessToken, env.NEXTAUTH_SECRET!);
          }
        } else {
          // Use AES-GCM fallback directly
          encryptedBlob = await encryptWithFallback(tokenData.accessToken, env.NEXTAUTH_SECRET!);
        }
        
        const secureToken = await prisma.secureToken.create({
          data: {
            tokenRef,
            orgId,
            provider,
            tokenType: 'oauth_access',
            encryptedTokenBlob: encryptedBlob,
            encryptionStatus: 'ok',
            keyVersion: 1,
            expiresAt: tokenData.expiresAt,
          }
        });

        results.push({
          tokenRef: secureToken.tokenRef,
          encryptionStatus: 'ok',
          keyVersion: secureToken.keyVersion || undefined,
          expiresAt: secureToken.expiresAt || undefined,
        });

        logger.info('Access token encrypted and stored successfully', {
          orgId,
          provider,
          tokenRef,
          externalAccountId
        });

      } catch (encryptionError: unknown) {
        // KMS failure - store placeholder with failed status
        logger.warn('KMS encryption failed for access token, storing as failed', {
          orgId,
          provider,
          externalAccountId,
          error: encryptionError?.message || encryptionError
        });

        const secureToken = await prisma.secureToken.create({
          data: {
            tokenRef,
            orgId,
            provider,
            tokenType: 'oauth_access',
            encryptionStatus: 'failed',
            kmsErrorCode: getErrorCode(encryptionError),
            kmsErrorAt: new Date(),
            expiresAt: tokenData.expiresAt,
          }
        });

        results.push({
          tokenRef: secureToken.tokenRef,
          encryptionStatus: 'failed',
          kmsErrorCode: secureToken.kmsErrorCode || undefined,
          kmsErrorAt: secureToken.kmsErrorAt || undefined,
          expiresAt: secureToken.expiresAt || undefined,
        });
      }
    }

    // Store refresh token
    if (tokenData.refreshToken) {
      const tokenRef = generateTokenRef(orgId, provider, 'oauth_refresh');
      
      try {
        let encryptedBlob: Uint8Array;
        const env = getEnv();
        
        if (env.KMS_PROVIDER && env.KMS_KEY_ID) {
          // Try KMS encryption first
          try {
            encryptedBlob = await encryptForOrg(
              orgId, 
              tokenData.refreshToken, 
              `oauth:refresh:${externalAccountId}`
            );
          } catch (kmsError) {
            logger.warn('KMS encryption failed, falling back to AES-GCM', {
              orgId,
              provider,
              error: (kmsError as unknown)?.message
            });
            
            // Fallback to AES-GCM using NEXTAUTH_SECRET
            encryptedBlob = await encryptWithFallback(tokenData.refreshToken, env.NEXTAUTH_SECRET!);
          }
        } else {
          // Use AES-GCM fallback directly
          encryptedBlob = await encryptWithFallback(tokenData.refreshToken, env.NEXTAUTH_SECRET!);
        }
        
        const secureToken = await prisma.secureToken.create({
          data: {
            tokenRef,
            orgId,
            provider,
            tokenType: 'oauth_refresh',
            encryptedTokenBlob: encryptedBlob,
            encryptionStatus: 'ok',
            keyVersion: 1,
          }
        });

        results.push({
          tokenRef: secureToken.tokenRef,
          encryptionStatus: 'ok',
          keyVersion: secureToken.keyVersion || undefined,
        });

        logger.info('Refresh token encrypted and stored successfully', {
          orgId,
          provider,
          tokenRef,
          externalAccountId
        });

      } catch (encryptionError: unknown) {
        // KMS failure - store placeholder with failed status
        logger.warn('KMS encryption failed for refresh token, storing as failed', {
          orgId,
          provider,
          externalAccountId,
          error: encryptionError?.message || encryptionError
        });

        const secureToken = await prisma.secureToken.create({
          data: {
            tokenRef,
            orgId,
            provider,
            tokenType: 'oauth_refresh',
            encryptionStatus: 'failed',
            kmsErrorCode: getErrorCode(encryptionError),
            kmsErrorAt: new Date(),
          }
        });

        results.push({
          tokenRef: secureToken.tokenRef,
          encryptionStatus: 'failed',
          kmsErrorCode: secureToken.kmsErrorCode || undefined,
          kmsErrorAt: secureToken.kmsErrorAt || undefined,
        });
      }
    }

    return results;

  } catch (error: unknown) {
    logger.error('Failed to store tokens securely', {
      orgId,
      provider,
      externalAccountId,
      error: (error as unknown)?.message || error
    });
    throw error;
  }
}

/**
 * Retrieves and decrypts tokens by reference
 */
export async function getTokensSecurely(tokenRefs: string[]): Promise<TokenData> {
  const result: TokenData = {};
  
  for (const tokenRef of tokenRefs) {
    try {
      const secureToken = await prisma.secureToken.findUnique({
        where: { tokenRef }
      });

      if (!secureToken) {
        logger.warn('Token reference not found', { tokenRef });
        continue;
      }

      if (secureToken.encryptionStatus !== 'ok' || !secureToken.encryptedTokenBlob) {
        logger.warn('Token not available - encryption failed or pending', {
          tokenRef,
          encryptionStatus: secureToken.encryptionStatus
        });
        continue;
      }

      const decryptedBytes = await decryptForOrg(
        secureToken.orgId,
        secureToken.encryptedTokenBlob,
        `oauth:${secureToken.tokenType}:${tokenRef}`
      );

      const decryptedToken = Buffer.from(decryptedBytes).toString('utf8');

      if (secureToken.tokenType === 'oauth_access') {
        result.accessToken = decryptedToken;
        result.expiresAt = secureToken.expiresAt || undefined;
      } else if (secureToken.tokenType === 'oauth_refresh') {
        result.refreshToken = decryptedToken;
      }

    } catch (error: unknown) {
      logger.error('Failed to decrypt token', {
        tokenRef,
        error: (error as unknown)?.message || error
      });
    }
  }

  return result;
}

/**
 * Retries failed token encryptions
 */
export async function retryFailedTokenEncryption(tokenRef: string, originalToken: string): Promise<boolean> {
  try {
    const secureToken = await prisma.secureToken.findUnique({
      where: { tokenRef }
    });

    if (!secureToken || secureToken.encryptionStatus !== 'failed') {
      return false;
    }

    const aadContext = `oauth:${secureToken.tokenType}:${tokenRef}`;
    const encryptedBlob = await encryptForOrg(secureToken.orgId, originalToken, aadContext);

    await prisma.secureToken.update({
      where: { tokenRef },
      data: {
        encryptedTokenBlob: encryptedBlob,
        encryptionStatus: 'ok',
        keyVersion: 1,
        kmsErrorCode: null,
        kmsErrorAt: null,
        retryCount: { increment: 1 },
        lastRetryAt: new Date(),
      }
    });

    logger.info('Successfully retried token encryption', { tokenRef });
    return true;

  } catch (error: unknown) {
    // Update retry count even on failure
    await prisma.secureToken.update({
      where: { tokenRef },
      data: {
        retryCount: { increment: 1 },
        lastRetryAt: new Date(),
        kmsErrorCode: getErrorCode(error),
        kmsErrorAt: new Date(),
      }
    });

    logger.error('Token encryption retry failed', { tokenRef, error });
    return false;
  }
}

/**
 * Extracts error code from encryption error
 */
function getErrorCode(error: unknown): string {
  if (error?.code) return error.code;
  if (error?.name) return error.name;
  return 'UNKNOWN_ERROR';
}

/**
 * Gets token encryption status for monitoring
 */
export async function getTokenEncryptionStatus(orgId: string): Promise<{
  totalTokens: number;
  okTokens: number;
  pendingTokens: number;
  failedTokens: number;
  oldestFailure?: Date;
}> {
  const stats = await prisma.secureToken.groupBy({
    by: ['encryptionStatus'],
    where: { orgId },
    _count: { id: true }
  });

  const result = {
    totalTokens: 0,
    okTokens: 0,
    pendingTokens: 0,
    failedTokens: 0,
  };

  for (const stat of stats) {
    result.totalTokens += stat._count.id;
    if (stat.encryptionStatus === 'ok') result.okTokens += stat._count.id;
    if (stat.encryptionStatus === 'pending') result.pendingTokens += stat._count.id;
    if (stat.encryptionStatus === 'failed') result.failedTokens += stat._count.id;
  }

  // Get oldest failure for monitoring
  const oldestFailure = await prisma.secureToken.findFirst({
    where: { orgId, encryptionStatus: 'failed' },
    orderBy: { kmsErrorAt: 'asc' },
    select: { kmsErrorAt: true }
  });

  return {
    ...result,
    oldestFailure: oldestFailure?.kmsErrorAt || undefined,
  };
}

/**
 * Fallback AES-GCM encryption using NEXTAUTH_SECRET
 */
async function encryptWithFallback(data: string, secret: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret.slice(0, 32).padEnd(32, '0')),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encoder.encode(data)
  );
  
  // Combine IV + encrypted data
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);
  
  return result;
}

/**
 * Fallback AES-GCM decryption using NEXTAUTH_SECRET
 */
async function decryptWithFallback(encryptedData: Uint8Array, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret.slice(0, 32).padEnd(32, '0')),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const iv = encryptedData.slice(0, 12);
  const encrypted = encryptedData.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encrypted
  );
  
  return decoder.decode(decrypted);
}
