import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { handleOAuthCallback, type OAuthCallbackData } from "@/server/onboarding";

/**
 * Debug endpoint to manually trigger OAuth onboarding
 * This forces the creation of EmailAccount and CalendarAccount records
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        error: "Not authenticated",
        message: "You must be signed in to trigger onboarding"
      }, { status: 401 });
    }

    // Get the request body for provider info
    const body = await req.json().catch(() => ({}));
    const provider = body.provider || 'google';
    
    console.log('🔧 Force onboarding triggered', {
      userEmail: session.user.email,
      provider,
      timestamp: new Date().toISOString()
    });

    // Simulate OAuth callback data
    const onboardingData: OAuthCallbackData = {
      userId: session.user.email,
      userEmail: session.user.email,
      userName: session.user.name || session.user.email,
      userImage: session.user.image || null,
      provider: provider,
      externalAccountId: session.user.email, // Use email as fallback ID
      account: {
        type: 'oauth',
        provider: provider,
        providerAccountId: session.user.email,
        // Note: These tokens would normally come from OAuth
        access_token: 'manual_trigger_token',
        refresh_token: 'manual_trigger_refresh',
        scope: provider === 'google' 
          ? 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly'
          : 'openid email profile offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Calendars.ReadWrite',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        token_type: 'Bearer'
      }
    };

    // Execute the onboarding flow
    const result = await handleOAuthCallback(onboardingData);

    return NextResponse.json({
      message: "Onboarding triggered manually",
      provider,
      userEmail: session.user.email,
      result: {
        success: result.success,
        orgId: result.orgId,
        emailAccountId: result.emailAccountId,
        calendarAccountId: result.calendarAccountId,
        isFirstTimeUser: result.isFirstTimeUser,
        encryptionStatus: result.encryptionStatus,
        errors: result.errors
      },
      note: "This creates accounts with dummy tokens. You'll need to reconnect for real tokens.",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Force onboarding failed:', error);
    return NextResponse.json({
      error: "Force onboarding failed",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
