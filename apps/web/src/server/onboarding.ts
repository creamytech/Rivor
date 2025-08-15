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
  calendarAccountId?: string;
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
 * Robust OAuth Account Onboarding
 * Always creates/maintains Organization, EmailAccount, and CalendarAccount records regardless of KMS failures
 * Uses single transaction to ensure atomicity
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
    // Execute all provisioning in a single transaction for atomicity
    const provisioningResult = await prisma.$transaction(async (tx) => {
      // Step 1: Upsert User
      const user = await tx.user.upsert({
        where: { email: data.userEmail },
        update: {
          name: data.userName || undefined,
          image: data.userImage || undefined,
        },
        create: {
          email: data.userEmail,
          name: data.userName || null,
          image: data.userImage || null,
        },
      });

      // Step 1.5: Create NextAuth Account record for OAuth compatibility
      await tx.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: data.provider,
            providerAccountId: data.externalAccountId
          }
        },
        update: {
          access_token: data.account.access_token,
          refresh_token: data.account.refresh_token,
          expires_at: data.account.expires_at,
          token_type: data.account.token_type,
          scope: data.account.scope,
          id_token: data.account.id_token,
          session_state: data.account.session_state,
        },
        create: {
          userId: user.id,
          type: data.account.type || 'oauth',
          provider: data.provider,
          providerAccountId: data.externalAccountId,
          access_token: data.account.access_token,
          refresh_token: data.account.refresh_token,
          expires_at: data.account.expires_at,
          token_type: data.account.token_type,
          scope: data.account.scope,
          id_token: data.account.id_token,
          session_state: data.account.session_state,
        }
      });

      // Step 2: Ensure default Organization
      let org = await tx.org.findFirst({
        where: { 
          OR: [
            { name: data.userEmail },
            { ownerUserId: user.id }
          ]
        }
      });

      let isFirstTimeUser = false;
      if (!org) {
        // Create default org with proper encryption setup
        let encryptedDekBlob: Uint8Array;
        try {
          const env = getEnv();
          if (env.KMS_PROVIDER && env.KMS_KEY_ID) {
            const kms = createKmsClient(env.KMS_PROVIDER, env.KMS_KEY_ID);
            const dek = generateDek();
            encryptedDekBlob = await kms.encryptDek(dek);
          } else {
            encryptedDekBlob = new Uint8Array(32);
          }
        } catch {
          encryptedDekBlob = new Uint8Array(32);
        }

        const slug = data.userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
        org = await tx.org.create({
          data: {
            name: data.userEmail,
            slug,
            ownerUserId: user.id,
            encryptedDekBlob: Buffer.from(encryptedDekBlob),
            retentionDays: 365,
          },
        });
        isFirstTimeUser = true;
      }

      // Step 3: Ensure OrgMember
      const existingMember = await tx.orgMember.findFirst({
        where: { orgId: org.id, userId: user.id }
      });

      if (!existingMember) {
        await tx.orgMember.create({
          data: {
            orgId: org.id,
            userId: user.id,
            role: isFirstTimeUser ? 'owner' : 'member',
          },
        });
      }

      // Step 4: Upsert EmailAccount
      const emailAccount = await tx.emailAccount.upsert({
        where: {
          userId_provider: {
            userId: user.id,
            provider: data.provider
          }
        },
        update: {
          email: data.userEmail,
          displayName: data.userName || null,
          tokenStatus: 'pending_encryption',
          status: 'connected',
          encryptionStatus: 'pending',
          errorReason: null,
          kmsErrorCode: null,
          kmsErrorAt: null,
        },
        create: {
          orgId: org.id,
          userId: user.id,
          provider: data.provider,
          externalAccountId: data.externalAccountId,
          email: data.userEmail,
          displayName: data.userName || null,
          status: 'connected',
          syncStatus: 'idle',
          encryptionStatus: 'pending',
          tokenStatus: 'pending_encryption',
        },
      });

      // Step 5: Create CalendarAccount if calendar scopes are present
      let calendarAccount: unknown = null;
      const hasCalendarScopes = data.account.scope?.includes('calendar') || 
                                data.account.scope?.includes('Calendars');
      
      if (hasCalendarScopes) {
        calendarAccount = await tx.calendarAccount.upsert({
          where: {
            orgId_provider: {
              orgId: org.id,
              provider: data.provider
            }
          },
          update: {
            status: 'connected'
          },
          create: {
            orgId: org.id,
            provider: data.provider,
            status: 'connected'
          }
        });
      }

      return {
        org,
        user,
        emailAccount,
        calendarAccount,
        isFirstTimeUser
      };
    });

    result.orgId = provisioningResult.org.id;
    result.emailAccountId = provisioningResult.emailAccount.id;
    result.calendarAccountId = provisioningResult.calendarAccount?.id;
    result.isFirstTimeUser = provisioningResult.isFirstTimeUser;

    logger.info('OAuth provisioning completed', {
      correlationId,
      orgId: result.orgId,
      emailAccountId: result.emailAccountId,
      calendarAccountId: result.calendarAccountId,
      isFirstTime: result.isFirstTimeUser,
    });

    // Step 6: Store tokens securely (never block on encryption failures)
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
          result.orgId,
          data.provider,
          tokenData,
          data.externalAccountId
        );

        tokenEncryptionSuccessful = tokenResults.every(token => token.encryptionStatus === 'ok');

        if (tokenEncryptionSuccessful) {
          await prisma.emailAccount.update({
            where: { id: result.emailAccountId! },
            data: {
              encryptionStatus: 'ok',
              tokenStatus: 'encrypted',
              tokenRef: tokenResults.find(t => t.tokenRef)?.tokenRef,
              kmsErrorCode: null,
              kmsErrorAt: null,
            },
          });

          result.encryptionStatus = 'ok';
          logger.info('Token encryption successful', {
            correlationId,
            emailAccountId: result.emailAccountId,
            tokenCount: tokenResults.length,
          });

        } else {
          // Encryption failed but we still keep the account connected
          await prisma.emailAccount.update({
            where: { id: result.emailAccountId! },
            data: {
              encryptionStatus: 'failed',
              tokenStatus: 'failed',
              kmsErrorCode: tokenResults.find(t => t.encryptionStatus === 'failed')?.kmsErrorCode,
              kmsErrorAt: new Date(),
            },
          });

          result.encryptionStatus = 'failed';
          result.requiresTokenRetry = true;
          result.errors.push('Token encryption failed - account connected but requires reconnection for sync');

          logger.warn('Token encryption failed but account provisioned', {
            correlationId,
            emailAccountId: result.emailAccountId,
            failedTokens: tokenResults.filter(t => t.encryptionStatus === 'failed').length,
          });
        }

      } catch (tokenError) {
        // Complete token storage failure - account still connected
        await prisma.emailAccount.update({
          where: { id: result.emailAccountId! },
          data: {
            encryptionStatus: 'failed',
            tokenStatus: 'failed',
            kmsErrorCode: getErrorCode(tokenError),
            kmsErrorAt: new Date(),
          },
        });

        result.encryptionStatus = 'failed';
        result.requiresTokenRetry = true;
        result.errors.push(`Token storage failed but account provisioned: ${(tokenError as unknown)?.message || tokenError}`);

        logger.error('Token storage failed but account provisioned', {
          correlationId,
          emailAccountId: result.emailAccountId,
          error: (tokenError as unknown)?.message || tokenError,
        });
      }
    } else {
      // No tokens provided - mark as pending encryption
      await prisma.emailAccount.update({
        where: { id: result.emailAccountId! },
        data: {
          tokenStatus: 'pending_encryption',
          encryptionStatus: 'pending',
        },
      });

      result.encryptionStatus = 'pending';
      result.requiresTokenRetry = true;
      result.errors.push('No tokens provided - reconnection required');
      logger.warn('No tokens to store', { correlationId, emailAccountId: result.emailAccountId });
    }

    // Step 7: Schedule initial sync if encryption was successful
    if (tokenEncryptionSuccessful) {
      try {
        await scheduleInitialSync(result.orgId, result.emailAccountId!, result.calendarAccountId);
        logger.info('Initial sync scheduled', {
          correlationId,
          emailAccountId: result.emailAccountId,
          calendarAccountId: result.calendarAccountId,
        });
      } catch (syncError) {
        // Don't fail the whole flow if sync scheduling fails
        logger.warn('Failed to schedule initial sync', {
          correlationId,
          emailAccountId: result.emailAccountId,
          error: (syncError as unknown)?.message || syncError,
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

    console.log('✅ Provisioning done', {
      orgId: result.orgId,
      emailAccountId: result.emailAccountId,
      encryptionStatus: result.encryptionStatus,
      success: result.success,
      duration
    });

    logger.info('OAuth callback completed', {
      correlationId,
      duration,
      success: result.success,
    });

    return result;

  } catch (error: unknown) {
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
      error: (kmsError as unknown)?.message || kmsError,
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
 * Schedules initial email and calendar backfill
 */
async function scheduleInitialSync(orgId: string, emailAccountId: string, calendarAccountId?: string): Promise<void> {
  // Import the queue functions dynamically to avoid circular dependencies
  const { enqueueEmailBackfill, enqueueCalendarBackfill } = await import("./queue");
  
  // Schedule email backfill (last 90 days)
  await enqueueEmailBackfill(orgId, emailAccountId, 90);
  
  // Schedule calendar backfill if calendar account exists
  if (calendarAccountId) {
    await enqueueCalendarBackfill(orgId, calendarAccountId, 90);
  }
  
  logger.info('Initial backfill scheduled', {
    orgId,
    emailAccountId,
    calendarAccountId,
    action: 'backfill_scheduled'
  });
}

/**
 * Helper to extract error codes
 */
function getErrorCode(error: unknown): string {
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
