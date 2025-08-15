import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@/server/db";

/**
 * Debug endpoint to manually create OAuthAccount record for JWT strategy
 * This allows background workers to access OAuth tokens
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        error: "Not authenticated",
        message: "You must be signed in to create OAuth account"
      }, { status: 401 });
    }

    // Get user and their current EmailAccount
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        emailAccounts: true
      }
    });

    if (!user || user.emailAccounts.length === 0) {
      return NextResponse.json({
        error: "No email accounts found",
        message: "User must have EmailAccount records to create OAuthAccount"
      }, { status: 400 });
    }

    const emailAccount = user.emailAccounts[0]; // Get first account (Google)
    
    console.log('🔧 Creating OAuthAccount for background workers', {
      userEmail: session.user.email,
      provider: emailAccount.provider,
      timestamp: new Date().toISOString()
    });

    // Check if OAuthAccount already exists
    const existingOAuth = await prisma.oAuthAccount.findFirst({
      where: {
        userId: user.id, // Use User.id instead of email
        provider: emailAccount.provider
      }
    });

    if (existingOAuth) {
      return NextResponse.json({
        message: "OAuthAccount already exists",
        provider: emailAccount.provider,
        userEmail: session.user.email,
        userId: user.id,
        oauthAccountId: existingOAuth.id,
        timestamp: new Date().toISOString()
      });
    }

    // Create OAuthAccount with placeholder tokens
    // Note: In JWT strategy, real tokens are in the JWT, not easily accessible here
    // Background workers will need to be updated to handle this differently
    const oauthAccount = await prisma.oAuthAccount.create({
      data: {
        userId: user.id, // Use User.id instead of email
        provider: emailAccount.provider,
        providerId: (session.user as any).providerId || session.user.email,
        // Store placeholder encrypted tokens - real tokens are in JWT
        accessToken: Buffer.from('jwt_strategy_placeholder_access_token'),
        refreshToken: Buffer.from('jwt_strategy_placeholder_refresh_token'),
        scope: emailAccount.provider === 'google' 
          ? 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly'
          : 'openid email profile offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Calendars.ReadWrite',
        expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
      }
    });

    return NextResponse.json({
      message: "OAuthAccount created for background worker compatibility",
      provider: emailAccount.provider,
      userEmail: session.user.email,
      oauthAccountId: oauthAccount.id,
      note: "This contains placeholder tokens. Background workers need to be updated for JWT strategy.",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to create OAuthAccount:', error);
    return NextResponse.json({
      error: "Failed to create OAuthAccount",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
