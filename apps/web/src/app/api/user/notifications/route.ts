import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const orgId = (session as { orgId?: string }).orgId;
  if (!orgId || orgId === 'default' || orgId === 'unknown') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const membership = await prisma.orgMember.findFirst({
      where: { orgId, user: { email: session.user.email } }
    });

    if (!membership) {
      return new Response('Forbidden', { status: 403 });
    }

    // For now, return default notification preferences
    // In a real implementation, you'd store these in the database
    const defaultPreferences = {
      emailDigest: true,
      newLeads: true,
      taskReminders: true,
      meetingReminders: true,
      systemUpdates: false,
      marketingEmails: false
    };

    return Response.json(defaultPreferences);
  } catch (error) {
    console.error('Failed to fetch notification preferences:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const orgId = (session as { orgId?: string }).orgId;
  if (!orgId || orgId === 'default' || orgId === 'unknown') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const membership = await prisma.orgMember.findFirst({
      where: { orgId, user: { email: session.user.email } }
    });

    if (!membership) {
      return new Response('Forbidden', { status: 403 });
    }

    const body = await request.json();
    const { emailDigest, newLeads, taskReminders, meetingReminders, systemUpdates, marketingEmails } = body;

    // Validate input
    const preferences = {
      emailDigest: Boolean(emailDigest),
      newLeads: Boolean(newLeads),
      taskReminders: Boolean(taskReminders),
      meetingReminders: Boolean(meetingReminders),
      systemUpdates: Boolean(systemUpdates),
      marketingEmails: Boolean(marketingEmails)
    };

    // In a real implementation, you'd store these preferences in the database
    // For now, we'll just return success
    logger.info('Notification preferences updated', {
      userId: session.user.email,
      preferences
    });

    return Response.json({ success: true, preferences });
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
