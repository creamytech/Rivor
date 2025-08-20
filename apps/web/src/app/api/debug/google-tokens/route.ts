import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { decryptForOrg } from '@/server/crypto';
import { logger } from '@/lib/logger';

// Force dynamic rendering - this route uses session/auth data and encrypted tokens
export const dynamic = 'force-dynamic';

export async function GET(__req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const orgId = (session as { orgId?: string }).orgId;

    if (!orgId || orgId === 'unknown') {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }

    // Get user to find correct userId
    const userRecord = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all OAuth accounts for this user using correct User.id
    const accounts = await prisma.oAuthAccount.findMany({
      where: {
        userId: userRecord.id // Use User.id instead of email
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const accountDetails = await Promise.all(
      accounts.map(async (account) => {
        const details: Record<string, unknown> = {
          id: account.id,
          provider: account.provider,
          providerId: account.providerId,
          userId: account.userId,
          scope: account.scope,
          expiresAt: account.expiresAt,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
          accessTokenLength: account.accessToken?.length || 0,
          refreshTokenLength: account.refreshToken?.length || 0,
          hasAccessToken: !!account.accessToken && account.accessToken.length > 0,
          hasRefreshToken: !!account.refreshToken && account.refreshToken.length > 0,
          isExpired: account.expiresAt ? account.expiresAt < new Date() : false
        };

        // Try to decrypt tokens to check if they're valid
        if (account.provider === 'google') {
          try {
            // Decrypt access token
            if (account.accessToken && account.accessToken.length > 0) {
              const accessTokenBytes = await decryptForOrg(orgId, account.accessToken, 'oauth:access');
              const accessToken = new TextDecoder().decode(accessTokenBytes);
              details.decryptedAccessTokenLength = accessToken.length;
              details.accessTokenValid = accessToken.length > 0;
              details.accessTokenPreview = accessToken.substring(0, 20) + '...'; // Safe preview
            }

            // Decrypt refresh token
            if (account.refreshToken && account.refreshToken.length > 0) {
              const refreshTokenBytes = await decryptForOrg(orgId, account.refreshToken, 'oauth:refresh');
              const refreshToken = new TextDecoder().decode(refreshTokenBytes);
              details.decryptedRefreshTokenLength = refreshToken.length;
              details.refreshTokenValid = refreshToken.length > 0;
              details.refreshTokenPreview = refreshToken.substring(0, 20) + '...'; // Safe preview
            }

            // Check scopes
            const scopes = account.scope?.split(' ') || [];
            details.hasGmailScope = scopes.includes('https://www.googleapis.com/auth/gmail.readonly');
            details.hasCalendarScope = scopes.includes('https://www.googleapis.com/auth/calendar.readonly');
            details.hasRequiredScopes = details.hasGmailScope && details.hasCalendarScope;

          } catch (decryptError) {
            details.decryptionError = decryptError instanceof Error ? decryptError.message : 'Unknown error';
            details.canDecrypt = false;
          }
        }

        return details;
      })
    );

    // Get user and org information
    const userWithOrg = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        orgMembers: {
          include: { org: true }
        }
      }
    });

    const response = {
      timestamp: new Date().toISOString(),
      session: {
        userEmail,
        orgId,
        sessionValid: !!session
      },
      userRecord: {
        found: !!userWithOrg,
        email: userWithOrg?.email,
        orgMemberships: userWithOrg?.orgMembers?.length || 0,
        primaryOrgId: userWithOrg?.orgMembers?.[0]?.org?.id,
        primaryOrgName: userWithOrg?.orgMembers?.[0]?.org?.name
      },
      oauthAccounts: {
        total: accounts.length,
        googleAccounts: accounts.filter(a => a.provider === 'google').length,
        microsoftAccounts: accounts.filter(a => a.provider === 'azure-ad').length,
        details: accountDetails
      },
      diagnosis: {
        hasGoogleAccount: accountDetails.some(a => a.provider === 'google'),
        hasValidGoogleRefreshToken: accountDetails.some(a => 
          a.provider === 'google' && a.refreshTokenValid === true
        ),
        hasValidGoogleAccessToken: accountDetails.some(a => 
          a.provider === 'google' && a.accessTokenValid === true
        ),
        hasRequiredScopes: accountDetails.some(a => 
          a.provider === 'google' && a.hasRequiredScopes === true
        ),
        sessionOrgMatches: orgId === userWithOrg?.orgMembers?.[0]?.org?.id,
        userEmailMatches: accountDetails.some(a => a.userId === userEmail)
      }
    };

    logger.info('Google tokens debug completed', {
      userEmail,
      orgId,
      accountCount: accounts.length,
      googleAccountCount: accountDetails.filter(a => a.provider === 'google').length,
      action: 'debug_tokens_complete'
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error: unknown) {
    logger.error('Google tokens debug failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      action: 'debug_tokens_failed'
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Debug failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
