import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { checkTokenHealth } from '@/server/oauth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userEmail = session.user?.email;
    
    if (!userEmail) {
      return new Response('No user email found', { status: 400 });
    }

    // Check token health with error handling
    let tokenHealth = [];
    let hasEmailIntegration = false;
    let hasCalendarIntegration = false;

    try {
      tokenHealth = await checkTokenHealth(userEmail).catch(() => []);

      // Check integration status based on specific scopes
      hasEmailIntegration = tokenHealth.some(t => 
        t.connected && !t.expired && (
          t.scopes.includes('https://www.googleapis.com/auth/gmail.readonly') ||
          t.scopes.includes('https://graph.microsoft.com/Mail.Read')
        )
      );
      hasCalendarIntegration = tokenHealth.some(t => 
        t.connected && !t.expired && (
          t.scopes.includes('https://www.googleapis.com/auth/calendar.readonly') ||
          t.scopes.includes('https://graph.microsoft.com/Calendars.ReadWrite')
        )
      );
    } catch (error) {
      console.error('Token health check failed:', error);
      // Use default values if token health check fails
      tokenHealth = [];
      hasEmailIntegration = false;
      hasCalendarIntegration = false;
    }

    return Response.json({
      tokenHealth,
      hasEmailIntegration,
      hasCalendarIntegration,
      showOnboarding: !hasEmailIntegration && !hasCalendarIntegration
    });
  } catch (error) {
    console.error('Token health API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
