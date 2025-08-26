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
                    hasTokenRef: true,
                    errorReason: true
                  }
                },
                calendarAccounts: {
                  select: {
                    id: true,
                    provider: true,
                    status: true,
                    externalAccountId: true,
                    tokenRef: true,
                    tokenStatus: true
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
            acc.provider === 'google' && 
            acc.providerAccountId === calendar.externalAccountId
          );
          const matchingOAuthAccount = user.oauthAccounts.find(acc =>
            acc.provider === 'google' &&
            acc.providerId === calendar.externalAccountId
          );
          const secureToken = user.orgMembers[0]?.org?.secureTokens?.find(token => 
            token.tokenRef === calendar.tokenRef
          );
          return {
            calendarAccountId: calendar.id,
            externalAccountId: calendar.externalAccountId,
            tokenRef: calendar.tokenRef,
            tokenStatus: calendar.tokenStatus,
            matchingNextAuthAccount: matchingAccount?.id || 'NOT_FOUND',
            matchingOAuthAccount: matchingOAuthAccount?.id || 'NOT_FOUND',
            hasSecureToken: !!secureToken,
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
 * POST endpoint to manually encrypt existing plain tokens
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { encryptPlainTokens } = await req.json().catch(() => ({ encryptPlainTokens: false }));

    if (!encryptPlainTokens) {
      return NextResponse.json({ error: 'Set encryptPlainTokens: true to proceed' }, { status: 400 });
    }

    const { encryptForOrg } = await import('@/server/secure-tokens');

    // Find accounts with plain tokens but no encrypted tokens
    const accountsNeedingEncryption = await prisma.account.findMany({
      where: {
        user: { email: session.user.email },
        provider: 'google',
        OR: [
          {
            access_token: { not: null },
            access_token_enc: null
          },
          {
            refresh_token: { not: null },
            refresh_token_enc: null
          }
        ]
      }
    });

    const results = [];

    for (const account of accountsNeedingEncryption) {
      try {
        const updateData: any = {};

        // Encrypt access token if it exists
        if (account.access_token && !account.access_token_enc) {
          const encryptedAccessToken = await encryptForOrg(
            orgId,
            new TextEncoder().encode(account.access_token),
            `oauth:${account.provider}:access`
          );
          updateData.access_token_enc = encryptedAccessToken;
          updateData.access_token = null; // Clear plain token
        }

        // Encrypt refresh token if it exists
        if (account.refresh_token && !account.refresh_token_enc) {
          const encryptedRefreshToken = await encryptForOrg(
            orgId,
            new TextEncoder().encode(account.refresh_token),
            `oauth:${account.provider}:refresh`
          );
          updateData.refresh_token_enc = encryptedRefreshToken;
          updateData.refresh_token = null; // Clear plain token
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.account.update({
            where: { id: account.id },
            data: updateData
          });

          results.push({
            accountId: account.id,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            success: true,
            encryptedFields: Object.keys(updateData).filter(k => k.endsWith('_enc'))
          });
        }

      } catch (error) {
        results.push({
          accountId: account.id,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Update email account token status
    await prisma.emailAccount.updateMany({
      where: { orgId },
      data: { 
        tokenStatus: 'encrypted',
        status: 'connected',
        syncStatus: 'ready'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Encrypted tokens for ${results.filter(r => r.success).length} accounts`,
      results,
      totalProcessed: results.length
    });

  } catch (error) {
    console.error('Token encryption error:', error);
    return NextResponse.json({
      error: 'Failed to encrypt tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}