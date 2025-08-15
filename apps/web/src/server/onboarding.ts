import { prisma } from "./db";
import { storeTokensSecurely, type TokenData, type SecureTokenInfo } from "./secure-tokens";
import { createKmsClient, generateDek } from "@rivor/crypto";
import { getEnv } from "./env";
import { logger } from "@/lib/logger";
import { logOAuthCallbackSummary, logKmsFailure } from "./monitoring";
import type { Account, Profile } from "next-auth";

export interface OnboardingResult {
  success: boolean;
  orgId: string;
  emailAccountId?: string;
  isFirstTimeUser: boolean;
  requiresTokenRetry: boolean;
  encryptionStatus: 'ok' | 'pending' | 'failed';
  errors: string[];
}

export interface OAuthCallbackData {
  userId: string;
  userEmail: string;
  userName?: string;
  userImage?: string;
  provider: string;
  externalAccountId: string;
  account: Account;
  profile?: Profile;
}

/**
 * Robust Google Account Onboarding
 * Always creates/maintains Organization and EmailAccount records regardless of KMS failures
 */
export async function handleOAuthCallback(data: OAuthCallbackData): Promise<OnboardingResult> {
  const startTime = Date.now();
  const correlationId = `onboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('Starting OAuth callback onboarding', {
    correlationId,
    userId: data.userId,
    provider: data.provider,
    externalAccountId: data.externalAccountId,
    hasAccessToken: !!data.account.access_token,
    hasRefreshToken: !!data.account.refresh_token,
  });

  const result: OnboardingResult = {
    success: false,
    orgId: '',
    isFirstTimeUser: false,
    requiresTokenRetry: false,
    encryptionStatus: 'pending',
    errors: [],
  };

  try {
    // Step 1: Resolve user from session (already done by caller)
    
    // Step 2: Upsert Organization (create if first time)
    const org = await upsertOrganization(data.userId, data.userEmail);
    result.orgId = org.id;
    result.isFirstTimeUser = org.isNew;

    logger.info('Organization resolved', {
      correlationId,
      orgId: org.id,
      isFirstTime: org.isNew,
    });

    // Step 3: Create/Upsert EmailAccount with provider metadata
    const emailAccount = await upsertEmailAccount(org.id, data);
    result.emailAccountId = emailAccount.id;

    logger.info('EmailAccount created/updated', {
      correlationId,
      emailAccountId: emailAccount.id,
      status: emailAccount.status,
      encryptionStatus: emailAccount.encryptionStatus,
    });

    // Step 4: Write tokens to secure store
    let tokenResults: SecureTokenInfo[] = [];
    let tokenEncryptionSuccessful = false;

    if (data.account.access_token || data.account.refresh_token) {
      try {
        const tokenData: TokenData = {
          accessToken: data.account.access_token || undefined,
          refreshToken: data.account.refresh_token || undefined,
          scope: data.account.scope || undefined,
          expiresAt: data.account.expires_at ? new Date(data.account.expires_at * 1000) : undefined,
        };

        tokenResults = await storeTokensSecurely(
          org.id,
          data.provider,
          tokenData,
          data.externalAccountId
        );

        // Check if all tokens were encrypted successfully
        tokenEncryptionSuccessful = tokenResults.every(token => token.encryptionStatus === 'ok');

        if (tokenEncryptionSuccessful) {
          // Update EmailAccount with successful encryption
          await prisma.emailAccount.update({
            where: { id: emailAccount.id },
            data: {
              encryptionStatus: 'ok',
              status: 'connected',
              tokenRef: tokenResults.find(t => t.tokenRef)?.tokenRef, // Reference to access token
              kmsErrorCode: null,
              kmsErrorAt: null,
            },
          });

          result.encryptionStatus = 'ok';
          logger.info('Token encryption successful', {
            correlationId,
            emailAccountId: emailAccount.id,
            tokenCount: tokenResults.length,
          });

        } else {
          // Some tokens failed encryption
          await prisma.emailAccount.update({
            where: { id: emailAccount.id },
            data: {
              encryptionStatus: 'failed',
              status: 'action_needed',
              kmsErrorCode: tokenResults.find(t => t.encryptionStatus === 'failed')?.kmsErrorCode,
              kmsErrorAt: new Date(),
            },
          });

          result.encryptionStatus = 'failed';
          result.requiresTokenRetry = true;
          result.errors.push('Token encryption failed - KMS may be unavailable');

          logger.warn('Token encryption partially failed', {
            correlationId,
            emailAccountId: emailAccount.id,
            successfulTokens: tokenResults.filter(t => t.encryptionStatus === 'ok').length,
            failedTokens: tokenResults.filter(t => t.encryptionStatus === 'failed').length,
          });
        }

      } catch (tokenError) {
        // Complete token storage failure
        await prisma.emailAccount.update({
          where: { id: emailAccount.id },
          data: {
            encryptionStatus: 'failed',
            status: 'action_needed',
            kmsErrorCode: getErrorCode(tokenError),
            kmsErrorAt: new Date(),
          },
        });

        result.encryptionStatus = 'failed';
        result.requiresTokenRetry = true;
        result.errors.push(`Token storage failed: ${(tokenError as any)?.message || tokenError}`);

        logger.error('Token storage completely failed', {
          correlationId,
          emailAccountId: emailAccount.id,
          error: (tokenError as any)?.message || tokenError,
        });
      }
    } else {
      // No tokens to store
      await prisma.emailAccount.update({
        where: { id: emailAccount.id },
        data: {
          status: 'action_needed',
          encryptionStatus: 'ok', // No encryption needed
        },
      });

      result.errors.push('No tokens provided in OAuth callback');
      logger.warn('No tokens to store', { correlationId, emailAccountId: emailAccount.id });
    }

    // Step 5: Schedule initial sync if encryption was successful
    if (tokenEncryptionSuccessful) {
      try {
        await scheduleInitialSync(org.id, emailAccount.id);
        logger.info('Initial sync scheduled', {
          correlationId,
          emailAccountId: emailAccount.id,
        });
      } catch (syncError) {
        // Don't fail the whole flow if sync scheduling fails
        logger.warn('Failed to schedule initial sync', {
          correlationId,
          emailAccountId: emailAccount.id,
          error: (syncError as any)?.message || syncError,
        });
      }
    }

    result.success = true;

    // Log final OAuth callback summary using structured logging
    const duration = Date.now() - startTime;
    
    // Use monitoring service for structured OAuth callback logging
    logOAuthCallbackSummary({
      userId: data.userId,
      provider: data.provider,
      externalAccountId: data.externalAccountId,
      orgCreated: org.isNew,
      emailAccountUpserted: true,
      kmsStatus: result.encryptionStatus === 'ok' ? 'ok' : 
                result.encryptionStatus === 'failed' ? 'failed' : 'fallback',
      success: result.success,
      errors: result.errors,
    });

    logger.info('OAuth callback completed', {
      correlationId,
      duration,
      success: result.success,
    });

    return result;

  } catch (error: any) {
    result.errors.push(`Onboarding failed: ${error?.message || error}`);
    
    logger.error('OAuth callback onboarding failed', {
      correlationId,
      userId: data.userId,
      provider: data.provider,
      error: error?.message || error,
      duration: Date.now() - startTime,
    });

    return result;
  }
}

/**
 * Upserts organization with proper encryption setup
 */
async function upsertOrganization(userId: string, userEmail: string): Promise<{ id: string; isNew: boolean }> {
  // Try to find existing org by name (email-based for now)
  let org = await prisma.org.findFirst({
    where: { name: userEmail }
  });

  if (org) {
    return { id: org.id, isNew: false };
  }

  // Create new organization with proper encryption
  let encryptedDekBlob: Uint8Array;
  try {
    const env = getEnv();
    if (env.KMS_PROVIDER && env.KMS_KEY_ID) {
      const kms = createKmsClient(env.KMS_PROVIDER, env.KMS_KEY_ID);
      const dek = generateDek();
      encryptedDekBlob = await kms.encryptDek(dek);
    } else {
      // Fallback for development - use dummy blob
      encryptedDekBlob = new Uint8Array(32);
      logger.warn('Using fallback encryption - configure KMS for production');
    }
  } catch (kmsError) {
    // KMS failure - use fallback but continue
    encryptedDekBlob = new Uint8Array(32);
    logger.warn('KMS encryption failed during org creation, using fallback', {
      userEmail,
      error: (kmsError as any)?.message || kmsError,
    });
  }

  // Generate slug from email
  const slug = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');

  org = await prisma.org.create({
    data: {
      name: userEmail,
      slug,
      ownerUserId: userId,
      encryptedDekBlob: Buffer.from(encryptedDekBlob),
      retentionDays: 365,
    },
  });

  logger.info('Created new organization', {
    orgId: org.id,
    ownerUserId: userId,
    slug,
  });

  return { id: org.id, isNew: true };
}

/**
 * Creates or updates EmailAccount with idempotency
 */
async function upsertEmailAccount(orgId: string, data: OAuthCallbackData) {
  // First, find the actual User record to get the correct userId
  const user = await prisma.user.findUnique({
    where: { email: data.userEmail },
  });

  if (!user) {
    throw new Error(`User with email ${data.userEmail} not found`);
  }

  // Idempotency key: provider + external_account_id within org
  const existingAccount = await prisma.emailAccount.findFirst({
    where: {
      orgId,
      provider: data.provider,
      externalAccountId: data.externalAccountId,
    },
  });

  if (existingAccount) {
    // Update existing account with fresh data
    return await prisma.emailAccount.update({
      where: { id: existingAccount.id },
      data: {
        email: data.userEmail,
        displayName: data.userName || null,
        // Reset encryption status to pending for re-encryption
        encryptionStatus: 'pending',
        syncStatus: 'idle',
        errorReason: null,
        updatedAt: new Date(),
      },
    });
  }

  // Create new EmailAccount
  return await prisma.emailAccount.create({
    data: {
      orgId,
      userId: user.id, // Use the actual User ID from database
      provider: data.provider,
      externalAccountId: data.externalAccountId,
      email: data.userEmail,
      displayName: data.userName || null,
      status: 'connected', // Will be updated based on token encryption
      syncStatus: 'idle',
      encryptionStatus: 'pending',
    },
  });
}

/**
 * Schedules initial email sync
 */
async function scheduleInitialSync(orgId: string, emailAccountId: string): Promise<void> {
  // Import the queue function dynamically to avoid circular dependencies
  const { enqueueEmailSync } = await import("./queue");
  await enqueueEmailSync(orgId, emailAccountId);
}

/**
 * Helper to extract error codes
 */
function getErrorCode(error: any): string {
  if (error?.code) return error.code;
  if (error?.name) return error.name;
  return 'UNKNOWN_ERROR';
}

/**
 * Checks if OAuth callback is a duplicate (for idempotency)
 */
export async function isDuplicateCallback(
  userId: string,
  provider: string,
  externalAccountId: string
): Promise<boolean> {
  const existing = await prisma.emailAccount.findFirst({
    where: {
      userId,
      provider,
      externalAccountId,
      updatedAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
      },
    },
  });

  return !!existing;
}
