import { prisma } from "./db";
import { logger } from "@/lib/logger";

export interface TokenHealth {
  provider: string;
  connected: boolean;
  expired: boolean;
  scopes: string[];
  lastUpdated: Date;
  services: {
    gmail: {
      connected: boolean;
      lastSyncDate: Date | null;
      error: string | null;
    } | null;
    calendar: {
      connected: boolean;
      lastSyncDate: Date | null;
      error: string | null;
    } | null;
  };
  tokenValidation?: {
    isValid: boolean;
    needsRefresh: boolean;
    error?: string;
    lastChecked: Date;
  };
  lastProbeSuccess?: Date;
  lastProbeError?: string;
}

/**
 * Check token health for JWT strategy - uses EmailAccount records instead of OAuthAccount
 */
export async function checkTokenHealth(userEmail: string, skipValidation = false): Promise<TokenHealth[]> {
  const correlationId = `health-check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('Starting token health check', {
      userEmail,
      correlationId,
      skipValidation,
      action: 'health_check_start'
    });

    // For JWT strategy, check EmailAccount records instead of OAuthAccount
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        emailAccounts: true,
        orgMembers: {
          include: { org: true }
        }
      }
    });

    if (!user) {
      logger.warn('User not found for token health check', { userEmail, correlationId });
      return [];
    }

    const accounts = user.emailAccounts;

    // Add debugging for account lookup  
    logger.info('EmailAccount lookup debug', {
      userEmail,
      correlationId,
      foundAccounts: accounts.map(a => ({ 
        id: a.id,
        provider: a.provider, 
        userId: a.userId,
        status: a.status,
        encryptionStatus: a.encryptionStatus,
        tokenStatus: a.tokenStatus,
        tokenRef: a.tokenRef,
        updatedAt: a.updatedAt
      })),
      action: 'email_account_lookup_debug'
    });

    const tokenHealthPromises = accounts.map(async (account): Promise<TokenHealth> => {
      // For EmailAccount records, determine scopes based on provider and check token status
      const isConnected = account.status === 'connected' && 
                         account.encryptionStatus === 'ok' && 
                         account.tokenStatus === 'encrypted';
      
      // Determine scopes based on provider
      let scopes: string[] = [];
      if (account.provider === 'google') {
        scopes = [
          'openid',
          'email', 
          'profile',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/calendar.readonly'
        ];
      } else if (account.provider === 'microsoft') {
        scopes = [
          'openid',
          'email',
          'profile', 
          'offline_access',
          'https://graph.microsoft.com/Mail.Read',
          'https://graph.microsoft.com/Calendars.ReadWrite'
        ];
      }

      const baseHealth: TokenHealth = {
        provider: account.provider,
        connected: isConnected,
        expired: false, // EmailAccount doesn't track expiration directly
        scopes: scopes,
        lastUpdated: account.updatedAt,
        services: {
          gmail: account.provider === 'google' && isConnected ? {
            connected: true,
            lastSyncDate: account.lastSyncedAt || null,
            error: account.errorReason || null
          } : null,
          calendar: isConnected ? {
            connected: true,
            lastSyncDate: null,
            error: null
          } : null
        }
      };

      return baseHealth;
    });

    const tokenHealth = await Promise.all(tokenHealthPromises);

    logger.info('Token health check completed', {
      userEmail,
      correlationId,
      healthyAccounts: tokenHealth.filter(th => th.connected).length,
      totalAccounts: tokenHealth.length,
      action: 'health_check_complete'
    });

    return tokenHealth;

  } catch (error) {
    logger.error('Token health check failed', {
      userEmail,
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      action: 'health_check_error'
    });
    return [];
  }
}
