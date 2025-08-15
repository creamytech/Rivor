import { prisma } from "./db";
import { validateGoogleToken, validateAllGoogleTokens } from "./token-validation";
import { runOrgHealthProbes } from "./health-probes";
import { decryptForOrg } from "./crypto";
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
 * Check the health of OAuth tokens for a user with live validation
 */
/**
 * Helper function to check if account has valid refresh token by decrypting it
 */
async function hasValidRefreshToken(orgId: string, account: unknown): Promise<boolean> {
  if (!account.refreshToken || account.refreshToken.length === 0) {
    return false;
  }
  
  try {
    const refreshTokenBytes = await decryptForOrg(orgId, account.refreshToken, 'oauth:refresh');
    const refreshToken = new TextDecoder().decode(refreshTokenBytes);
    return refreshToken.length > 0;
  } catch (error) {
    logger.warn('Failed to decrypt refresh token', {
      accountId: account.id,
      provider: account.provider,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

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
            connected: true,
            lastSyncDate: account.lastSyncedAt || null,
            error: account.errorReason || null
          } : null,
          calendar: {
            connected: true,
            lastSyncDate: null, // CalendarAccount doesn't track this in same way
            error: null
          }
        };
              
              if (accountProbe && (accountProbe.gmail || accountProbe.calendar)) {
                // Use probe results
                baseHealth.services = {
                  gmail: accountProbe.gmail ? { 
                    service: 'gmail' as const,
                    success: accountProbe.gmail.status === 'ok',
                    timestamp: accountProbe.probeAt,
                    error: accountProbe.gmail.reason 
                  } : null,
                  calendar: accountProbe.calendar ? { 
                    service: 'calendar' as const,
                    success: accountProbe.calendar.status === 'ok',
                    timestamp: accountProbe.probeAt,
                    error: accountProbe.calendar.reason 
                  } : null
                };
                
                // Update overall status based on successful probes
                const hasSuccessfulProbe = 
                  (accountProbe.gmail?.status === 'ok') || 
                  (accountProbe.calendar?.status === 'ok');
                
                if (hasSuccessfulProbe) {
                  baseHealth.lastProbeSuccess = accountProbe.probeAt;
                } else {
                  baseHealth.lastProbeError = 
                    accountProbe.gmail?.reason || 
                    accountProbe.calendar?.reason ||
                    'Health probe failed';
                }
              } else {
                // No probe results available - services status unknown
                baseHealth.services = {
                  gmail: { 
                    service: 'gmail' as const,
                    success: false, 
                    timestamp: new Date(),
                    error: 'No recent health probe data' 
                  },
                  calendar: { 
                    service: 'calendar' as const,
                    success: false, 
                    timestamp: new Date(),
                    error: 'No recent health probe data' 
                  }
                };
              }
            }

            // Update connected status based on validation AND probe results
            const hasRecentSuccessfulProbe = baseHealth.lastProbeSuccess && 
              (Date.now() - baseHealth.lastProbeSuccess.getTime()) < (10 * 60 * 1000); // 10 minutes
            
            // More accurate connection status:
            // 1. Must have valid refresh token (checked earlier)
            // 2. Token validation must pass
            // 3. Must have either successful recent probe OR no service results yet
            baseHealth.connected = hasValidRefresh && 
              validationResult.isValid && 
              (hasRecentSuccessfulProbe || (!baseHealth.services.gmail && !baseHealth.services.calendar));
            
            if (!validationResult.isValid && validationResult.error) {
              baseHealth.lastProbeError = validationResult.error;
            }

            logger.info('Google token validation completed', {
              correlationId,
              accountId: account.id,
              hasValidRefresh,
              tokenValid: validationResult.isValid,
              hasRecentProbe: hasRecentSuccessfulProbe,
              finalConnectedStatus: baseHealth.connected,
              action: 'validation_complete'
            });
        } catch (validationError) {
          logger.error('Token validation failed during health check', {
            correlationId,
            provider: account.provider,
            error: validationError instanceof Error ? validationError.message : 'Unknown error',
            action: 'validation_error'
          });

          baseHealth.tokenValidation = {
            isValid: false,
            needsRefresh: true,
            error: validationError instanceof Error ? validationError.message : 'Validation failed',
            lastChecked: new Date()
          };
          baseHealth.connected = false;
        }
      }

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
