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

    // Check all possible token sources: Account (NextAuth), OAuthAccount, EmailAccount, and SecureToken
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          accounts: true,           // NextAuth Account model with encrypted tokens
          oauthAccounts: true,      // Custom OAuthAccount model  
          emailAccounts: true,      // EmailAccount with tokenRef to SecureToken
          orgMembers: {
            include: { org: true }
          }
        }
      });
    } catch (dbError) {
      logger.error('Database error in token health check', {
        userEmail,
        correlationId,
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        action: 'health_check_db_error'
      });
      return [];
    }

    if (!user) {
      logger.warn('User not found for token health check', { userEmail, correlationId });
      return [];
    }

    // Collect all token sources
    const allTokenSources: TokenHealth[] = [];

    // Add debugging for all token sources
    logger.info('All token sources debug', {
      userEmail,
      correlationId,
      nextAuthAccounts: user.accounts.length,
      oauthAccounts: user.oauthAccounts.length,
      emailAccounts: user.emailAccounts.length,
      action: 'token_sources_debug'
    });

    // 1. Check NextAuth Account model (encrypted tokens)
    for (const account of user.accounts) {
      if (account.provider === 'google') {
        const hasTokens = !!(account.access_token_enc || account.refresh_token_enc);
        const isExpired = account.expires_at ? (account.expires_at * 1000) < Date.now() : false;
        
        allTokenSources.push({
          provider: 'google',
          connected: hasTokens && !isExpired,
          expired: isExpired,
          expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
          scopes: account.scope ? account.scope.split(' ') : [],
          lastUpdated: account.updatedAt,
          services: { gmail: null, calendar: null }
        });
      }
    }

    // 2. Check custom OAuthAccount model
    for (const oauthAccount of user.oauthAccounts) {
      const isExpired = oauthAccount.expiresAt ? oauthAccount.expiresAt < new Date() : false;
      
      allTokenSources.push({
        provider: oauthAccount.provider,
        connected: !isExpired,
        expired: isExpired,
        expiresAt: oauthAccount.expiresAt || undefined,
        scopes: oauthAccount.scope ? oauthAccount.scope.split(' ') : [],
        lastUpdated: oauthAccount.updatedAt,
        services: { gmail: null, calendar: null }
      });
    }

    // 3. Check EmailAccount records (linked to SecureToken via tokenRef)
    const emailAccountHealthPromises = user.emailAccounts.map(async (account): Promise<TokenHealth> => {
      try {
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
      } catch (accountError) {
        logger.error('Error processing account in token health check', {
          correlationId,
          accountId: account.id,
          error: accountError instanceof Error ? accountError.message : 'Unknown account error',
          action: 'health_check_account_error'
        });
        
        // Return a basic health object for this account
        return {
          provider: account.provider,
          connected: false,
          expired: false,
          scopes: [],
          lastUpdated: account.updatedAt,
          services: {
            gmail: null,
            calendar: null
          }
        };
      }
    });

    // Combine EmailAccount health with other token sources
    const emailAccountHealth = await Promise.all(emailAccountHealthPromises);
    const allTokenHealth = [...allTokenSources, ...emailAccountHealth];

    logger.info('Token health check completed', {
      userEmail,
      correlationId,
      totalTokenSources: allTokenHealth.length,
      nextAuthTokens: user.accounts.length,
      oauthTokens: user.oauthAccounts.length,  
      emailAccounts: user.emailAccounts.length,
      connectedCount: allTokenHealth.filter(t => t.connected).length,
      action: 'health_check_complete'
    });

    return allTokenHealth;
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
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/calendar.readonly'
      ];
    case 'microsoft':
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
