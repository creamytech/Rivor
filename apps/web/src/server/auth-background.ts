import { prisma } from "./db";
import { encryptForOrg } from "./crypto";
import { logger } from "@/lib/logger";
import { handleOAuthCallback, isDuplicateCallback, type OAuthCallbackData } from "./onboarding";

interface AuthBackgroundJob {
  id: string;
  type: 'token_encryption' | 'onboarding' | 'org_setup';
  userId: string;
  data: any;
  priority: number;
  createdAt: Date;
}

class AuthJobQueue {
  private queue: AuthBackgroundJob[] = [];
  private processing = false;
  private processingTimeout: NodeJS.Timeout | null = null;

  enqueue(job: Omit<AuthBackgroundJob, 'id' | 'createdAt'>) {
    const newJob: AuthBackgroundJob = {
      ...job,
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      createdAt: new Date()
    };
    
    this.queue.push(newJob);
    this.queue.sort((a, b) => b.priority - a.priority);
    
    logger.info('Auth job enqueued', { 
      jobId: newJob.id, 
      type: newJob.type, 
      queueSize: this.queue.length 
    });
    
    this.scheduleProcessing();
  }

  private scheduleProcessing() {
    if (this.processing) return;
    
    // Process jobs after a short delay to allow auth to complete first
    this.processingTimeout = setTimeout(() => {
      this.processQueue();
    }, 1000);
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    logger.info('Starting auth job processing', { queueSize: this.queue.length });
    
    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      
      try {
        await this.processJob(job);
        logger.info('Auth job completed', { jobId: job.id, type: job.type });
      } catch (error) {
        logger.error('Auth job failed', { 
          jobId: job.id, 
          type: job.type, 
          error: error?.message || error 
        });
      }
    }
    
    this.processing = false;
    logger.info('Auth job processing completed');
  }

  private async processJob(job: AuthBackgroundJob) {
    switch (job.type) {
      case 'token_encryption':
        await this.processTokenEncryption(job.data);
        break;
      case 'onboarding':
        await this.processOnboarding(job.data);
        break;
      case 'org_setup':
        await this.processOrgSetup(job.data);
        break;
    }
  }

  private async processTokenEncryption(data: {
    userId: string;
    orgId: string;
    account: any;
    externalAccountId: string;
  }) {
    const { userId, orgId, account, externalAccountId } = data;
    
    try {
      const dbUser = await prisma.user.findUnique({ where: { email: userId } });
      if (!dbUser) return;

      // Encrypt OAuth tokens using KMS
      const accessTokenEnc = account.access_token ? 
        await encryptForOrg(orgId, new TextEncoder().encode(account.access_token), `oauth:${account.provider}:access`) : null;
      const refreshTokenEnc = account.refresh_token ? 
        await encryptForOrg(orgId, new TextEncoder().encode(account.refresh_token), `oauth:${account.provider}:refresh`) : null;
      const idTokenEnc = account.id_token ? 
        await encryptForOrg(orgId, new TextEncoder().encode(account.id_token), `oauth:${account.provider}:id`) : null;

      // Update NextAuth Account record with encrypted tokens
      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: externalAccountId
          }
        },
        update: {
          access_token_enc: accessTokenEnc,
          refresh_token_enc: refreshTokenEnc,
          id_token_enc: idTokenEnc,
        },
        create: {
          userId: dbUser.id,
          type: account.type || 'oauth',
          provider: account.provider,
          providerAccountId: externalAccountId,
          access_token_enc: accessTokenEnc,
          refresh_token_enc: refreshTokenEnc,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token_enc: idTokenEnc,
          session_state: account.session_state,
        }
      });
      
      logger.info('Background token encryption completed', { 
        userId, 
        provider: account.provider 
      });
    } catch (error) {
      logger.error('Background token encryption failed', { 
        userId, 
        error: error?.message || error 
      });
    }
  }

  private async processOnboarding(data: OAuthCallbackData) {
    try {
      const isDuplicate = await isDuplicateCallback(
        data.userId,
        data.provider,
        data.externalAccountId
      );

      if (isDuplicate) {
        logger.info('Skipping duplicate onboarding in background', {
          userId: data.userId,
          provider: data.provider
        });
        return;
      }

      const result = await handleOAuthCallback(data);
      
      if (!result.success) {
        logger.error('Background onboarding failed', {
          userId: data.userId,
          provider: data.provider,
          errors: result.errors,
        });
      } else {
        logger.info('Background onboarding completed', {
          userId: data.userId,
          provider: data.provider,
          orgId: result.orgId
        });
      }
    } catch (error) {
      logger.error('Background onboarding processing failed', {
        userId: data.userId,
        error: error?.message || error
      });
    }
  }

  private async processOrgSetup(data: {
    userId: string;
    userEmail: string;
    orgId?: string;
  }) {
    const { userId, userEmail, orgId } = data;
    
    try {
      let org = await prisma.org.findFirst({ 
        where: { 
          OR: [
            { name: userEmail },
            { ownerUserId: userEmail },
            { id: orgId || 'default' }
          ]
        } 
      });

      // If no org exists, create default org
      if (!org) {
        org = await prisma.org.create({
          data: {
            id: 'default',
            name: 'Default Organization',
            slug: 'default',
            ownerUserId: userEmail,
            encryptedDekBlob: Buffer.from('dummy-encryption-key-for-demo'),
            dekVersion: 1,
            ephemeralMode: true,
            retentionDays: 90
          }
        });
        logger.info('Background org creation completed', { orgId: org.id });
      }

      // Ensure user is member of org  
      const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
      if (dbUser && org) {
        await prisma.orgMember.upsert({
          where: {
            orgId_userId: {
              orgId: org.id,
              userId: dbUser.id
            }
          },
          update: {},
          create: {
            orgId: org.id,
            userId: dbUser.id,
            role: 'owner'
          }
        });
        logger.info('Background org membership completed', { 
          userId: dbUser.id, 
          orgId: org.id 
        });
      }
    } catch (error) {
      logger.error('Background org setup failed', {
        userId,
        error: error?.message || error
      });
    }
  }
}

export const authJobQueue = new AuthJobQueue();

// Helper functions to enqueue jobs
export function enqueueTokenEncryption(userId: string, orgId: string, account: any, externalAccountId: string) {
  authJobQueue.enqueue({
    type: 'token_encryption',
    userId,
    data: { userId, orgId, account, externalAccountId },
    priority: 2
  });
}

export function enqueueOnboarding(data: OAuthCallbackData) {
  authJobQueue.enqueue({
    type: 'onboarding',
    userId: data.userId,
    data,
    priority: 1
  });
}

export function enqueueOrgSetup(userId: string, userEmail: string, orgId?: string) {
  authJobQueue.enqueue({
    type: 'org_setup',
    userId,
    data: { userId, userEmail, orgId },
    priority: 3
  });
}