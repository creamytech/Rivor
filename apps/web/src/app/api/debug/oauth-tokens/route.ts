import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to inspect OAuth token storage
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get user's accounts with token data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          select: {
            id: true,
            provider: true,
            providerAccountId: true,
            type: true,
            access_token: true,
            refresh_token: true,
            expires_at: true,
            token_type: true,
            scope: true,
            id_token: true,
            session_state: true,
            createdAt: true,
            updatedAt: true
          }
        },
        oauthAccounts: {
          select: {
            id: true,
            provider: true,
            providerId: true,
            scope: true,
            expiresAt: true,
            createdAt: true,
            updatedAt: true
          }
        },
        orgMembers: {
          include: {
            org: {
              include: {
                emailAccounts: {
                  select: {
                    id: true,
                    email: true,
                    provider: true,
                    status: true,
                    tokenStatus: true,
                    syncStatus: true,
                    externalAccountId: true,
                    tokenRef: true,
                    errorReason: true
                  }
                },
                calendarAccounts: {
                  select: {
                    id: true,
                    provider: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                  }
                },
                secureTokens: {
                  select: {
                    id: true,
                    tokenRef: true,
                    tokenType: true,
                    createdAt: true,
                    updatedAt: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mask sensitive token data for security
    const maskedAccounts = user.accounts.map(account => ({
      ...account,
      access_token: account.access_token ? `***${account.access_token.slice(-4)}` : null,
      refresh_token: account.refresh_token ? `***${account.refresh_token.slice(-4)}` : null,
      id_token: account.id_token ? `***${account.id_token.slice(-4)}` : null
    }));

    const maskedOAuthAccounts = user.oauthAccounts.map(account => ({
      ...account,
      accessToken: '[encrypted bytes]',
      refreshToken: '[encrypted bytes]'
    }));

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      orgId,
      accounts: maskedAccounts,
      oauthAccounts: maskedOAuthAccounts,
      emailAccounts: user.orgMembers[0]?.org?.emailAccounts || [],
      calendarAccounts: user.orgMembers[0]?.org?.calendarAccounts || [],
      secureTokens: user.orgMembers[0]?.org?.secureTokens || [],
      tokenMapping: {
        explanation: "How email/calendar accounts should map to OAuth accounts",
        emailToOAuth: user.orgMembers[0]?.org?.emailAccounts?.map(email => {
          const matchingAccount = user.accounts.find(acc => 
            acc.provider === 'google' && 
            acc.providerAccountId === email.externalAccountId
          );
          const matchingOAuthAccount = user.oauthAccounts.find(acc =>
            acc.provider === 'google' &&
            acc.providerId === email.externalAccountId
          );
          const secureToken = user.orgMembers[0]?.org?.secureTokens?.find(token => 
            token.tokenRef === email.tokenRef
          );
          return {
            emailAccountId: email.id,
            externalAccountId: email.externalAccountId,
            tokenRef: email.tokenRef,
            tokenStatus: email.tokenStatus,
            matchingNextAuthAccount: matchingAccount?.id || 'NOT_FOUND',
            matchingOAuthAccount: matchingOAuthAccount?.id || 'NOT_FOUND',
            hasSecureToken: !!secureToken,
            hasPlainTokens: !!(matchingAccount?.access_token && matchingAccount?.refresh_token)
          };
        }) || [],
        calendarToOAuth: user.orgMembers[0]?.org?.calendarAccounts?.map(calendar => {
          const matchingAccount = user.accounts.find(acc => 
            acc.provider === 'google'
            // Note: CalendarAccount doesn't have externalAccountId, so we can't match directly
          );
          const matchingOAuthAccount = user.oauthAccounts.find(acc =>
            acc.provider === 'google'
            // Note: CalendarAccount doesn't have externalAccountId, so we can't match directly
          );
          return {
            calendarAccountId: calendar.id,
            provider: calendar.provider,
            status: calendar.status,
            note: "CalendarAccount model doesn't have externalAccountId or tokenRef fields",
            matchingNextAuthAccount: matchingAccount?.id || 'NOT_FOUND',
            matchingOAuthAccount: matchingOAuthAccount?.id || 'NOT_FOUND',
            hasPlainTokens: !!(matchingAccount?.access_token && matchingAccount?.refresh_token)
          };
        }) || []
      }
    });

  } catch (error) {
    console.error('OAuth token debug error:', error);
    return NextResponse.json({
      error: 'Failed to get OAuth token info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST endpoint placeholder - token encryption needs proper OAuth flow setup
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: "Token encryption is handled during OAuth flow",
      explanation: "Based on the database schema analysis, tokens should be encrypted automatically during the OAuth authentication process. If you're missing tokens, you need to reconnect your Google account through the proper OAuth flow.",
      recommendations: [
        "1. Check if you have plain tokens in the Account model (NextAuth)",
        "2. If tokens exist, the Gmail service will use them as fallback",
        "3. For proper encrypted storage, reconnect through OAuth flow",
        "4. The system supports multiple token storage methods (SecureToken, OAuthAccount, Account)"
      ]
    });

  } catch (error) {
    console.error('Token encryption error:', error);
    return NextResponse.json({
      error: 'Failed to process token encryption request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}