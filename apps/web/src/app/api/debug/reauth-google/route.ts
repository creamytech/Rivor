import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://www.rivor.ai/api/auth/callback/google'
    );

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Force consent to get refresh token
      scope: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.readonly'
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Redirect to Google OAuth for re-authentication',
      authUrl,
      instructions: [
        '1. Click the authUrl to go to Google OAuth',
        '2. Grant permissions to the app',
        '3. You will be redirected back to the app',
        '4. The new tokens will be automatically encrypted and stored'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
