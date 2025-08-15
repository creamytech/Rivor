import { prisma } from "./db";

export interface TokenHealth {
  provider: string;
  connected: boolean;
  expired: boolean;
  scopes: string[];
  lastUpdated: Date;
}

/**
 * Check the health of OAuth tokens for a user
 */
export async function checkTokenHealth(userEmail: string): Promise<TokenHealth[]> {
  try {
    const accounts = await prisma.oAuthAccount.findMany({
      where: {
        userId: userEmail
      }
    });

    return accounts.map(account => ({
      provider: account.provider,
      connected: true,
      expired: account.expiresAt ? account.expiresAt < new Date() : false,
      scopes: account.scope ? account.scope.split(' ') : [],
      lastUpdated: account.updatedAt
    }));
  } catch (error) {
    console.error('Error checking token health:', error);
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
