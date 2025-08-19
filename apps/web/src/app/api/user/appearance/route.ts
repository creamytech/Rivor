import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // For now, return default appearance preferences
    // In a real implementation, you'd store these in the database
    const defaultPreferences = {
      theme: 'system',
      animations: true,
      compactMode: false
    };

    return Response.json(defaultPreferences);
  } catch (error) {
    console.error('Failed to fetch appearance preferences:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { theme, animations, compactMode } = body;

    // Validate input
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      return new Response('Invalid theme', { status: 400 });
    }

    const preferences = {
      theme: theme || 'system',
      animations: Boolean(animations),
      compactMode: Boolean(compactMode)
    };

    // In a real implementation, you'd store these preferences in the database
    // For now, we'll just return success
    logger.info('Appearance preferences updated', {
      userId: session.user.email,
      preferences
    });

    return Response.json({ success: true, preferences });
  } catch (error) {
    console.error('Failed to update appearance preferences:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
