import { prisma } from "./db";
import { validateGoogleToken, validateAllGoogleTokens } from "./token-validation";
import { probeAllGoogleServices, getCachedProbeResults } from "./health-probes";
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
export async function checkTokenHealth(userEmail: string, skipValidation = false): Promise<TokenHealth[]> {
  const correlationId = `health-check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('Starting token health check', {
      userEmail,
      correlationId,
      skipValidation,
      action: 'health_check_start'
    });

    const accounts = await prisma.oAuthAccount.findMany({
      where: {
        userId: userEmail
      }
    });

    const tokenHealthPromises = accounts.map(async (account): Promise<TokenHealth> => {
      const baseHealth: TokenHealth = {
        provider: account.provider,
        connected: !!account.refreshToken && account.refreshToken.length > 0,
        expired: account.expiresAt ? account.expiresAt < new Date() : false,
        scopes: account.scope ? account.scope.split(' ') : [],
        lastUpdated: account.updatedAt,
        services: {
          gmail: null,
          calendar: null
        }
      };

      // For Google accounts, perform live token validation if not skipped
      if (account.provider === 'google' && !skipValidation) {
        try {
          // Find the org for this user
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
            
            // Validate tokens
            const validationResult = await validateGoogleToken(orgId, account.id);
            
            baseHealth.tokenValidation = {
              isValid: validationResult.isValid,
              needsRefresh: validationResult.needsRefresh,
              error: validationResult.error,
              lastChecked: new Date()
            };

            // Only proceed with service probes if tokens are valid
            if (validationResult.isValid) {
              // Get cached probe results or run new probes
              const cachedProbes = getCachedProbeResults(orgId);
              
              if (cachedProbes.gmail || cachedProbes.calendar) {
                // Use cached results
                baseHealth.services = {
                  gmail: cachedProbes.gmail,
                  calendar: cachedProbes.calendar
                };
                
                // Update overall status based on successful probes
                const hasSuccessfulProbe = 
                  (cachedProbes.gmail?.success) || 
                  (cachedProbes.calendar?.success);
                
                if (hasSuccessfulProbe) {
                  baseHealth.lastProbeSuccess = new Date(Math.max(
                    cachedProbes.gmail?.timestamp?.getTime() || 0,
                    cachedProbes.calendar?.timestamp?.getTime() || 0
                  ));
                }
              } else {
                // No cached results - run fresh probes
                try {
                  const probeResults = await probeAllGoogleServices(orgId, false);
                  baseHealth.services = probeResults;
                  
                  const hasSuccessfulProbe = probeResults.gmail.success || probeResults.calendar.success;
                  if (hasSuccessfulProbe) {
                    baseHealth.lastProbeSuccess = new Date();
                  } else {
                    baseHealth.lastProbeError = probeResults.gmail.error || probeResults.calendar.error;
                  }
                } catch (probeError) {
                  logger.warn('Service probes failed during health check', {
                    correlationId,
                    orgId,
                    error: probeError instanceof Error ? probeError.message : 'Unknown error'
                  });
                }
              }
            }

            // Update connected status based on validation AND successful probe
            const hasRecentSuccessfulProbe = baseHealth.lastProbeSuccess && 
              (Date.now() - baseHealth.lastProbeSuccess.getTime()) < (10 * 60 * 1000); // 10 minutes
            
            baseHealth.connected = validationResult.isValid && 
              (hasRecentSuccessfulProbe || !baseHealth.services.gmail && !baseHealth.services.calendar);
            
            if (!validationResult.isValid && validationResult.error) {
              baseHealth.lastProbeError = validationResult.error;
            }
          }
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
