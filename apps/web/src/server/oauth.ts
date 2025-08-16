import { prisma } from "./db";
import { logger } from "@/lib/logger";

export interface ProbeResult {
  service: 'gmail' | 'calendar';
  success: boolean;
  timestamp: Date;
  error?: string;
  latency?: number;
}

export interface TokenHealth {
  provider: string;
  connected: boolean;
  expired: boolean;
  scopes: string[];
  lastUpdated: Date;
  lastProbeSuccess?: Date;
  lastProbeError?: string;
  services: {
    gmail: ProbeResult | null;
    calendar: ProbeResult | null;
  };
  tokenValidation?: {
    isValid: boolean;
    needsRefresh: boolean;
    error?: string;
    lastChecked: Date;
  };
}

/**
 * Check the health of OAuth tokens for a user
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
      const orgId = user.orgMembers?.[0]?.org?.id;
      
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
          gmail: null,
          calendar: null
        }
      };

      // For connected accounts, assume services are available based on scopes
      if (isConnected) {
        baseHealth.services = {
          gmail: account.provider === 'google' ? {
            service: 'gmail' as const,
            success: true,
            timestamp: new Date()
          } : null,
          calendar: {
            service: 'calendar' as const,
            success: true,
            timestamp: new Date()
          }
        };
      }

      logger.info('Token health check completed for account', {
        correlationId,
        accountId: account.id,
        isConnected,
        finalConnectedStatus: baseHealth.connected,
        action: 'health_check_complete'
      });

      return baseHealth;
    });

    const tokenHealth = await Promise.all(tokenHealthPromises);

    logger.info('Token health check completed', {
      userEmail,
      correlationId,
      accountCount: accounts.length,
      connectedCount: tokenHealth.filter(t => t.connected).length,
      action: 'health_check_complete'
    });

    return tokenHealth;
  } catch (error) {
    logger.error('Error checking token health', {
      userEmail,
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      action: 'health_check_error'
    });
    return [];
  }
}

/**
 * Get missing required scopes for a provider
 */
export function getMissingScopes(provider: string, currentScopes: string[]): string[] {
  const requiredScopes = getRequiredScopes(provider);
  return requiredScopes.filter(scope => !currentScopes.includes(scope));
}

/**
 * Get required scopes for a provider
 */
export function getRequiredScopes(provider: string): string[] {
  switch (provider) {
    case 'google':
      return [
        'openid', 
        'email', 
        'profile', 
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.readonly'
      ];
    case 'azure-ad':
      return [
        'openid',
        'email', 
        'profile',
        'offline_access',
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.Send',
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/User.Read'
      ];
    default:
      return [];
  }
}
