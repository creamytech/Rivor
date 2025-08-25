import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    logger.info('Starting clear all operation', { orgId });

    // Delete all email threads and messages for this organization
    const emailThreadsDeleted = await prisma.emailThread.deleteMany({
      where: { orgId }
    });

    // Delete all calendar events for this organization
    const calendarEventsDeleted = await prisma.calendarEvent.deleteMany({
      where: { orgId }
    });

    // Delete all email messages (should cascade from threads, but being explicit)
    const emailMessagesDeleted = await prisma.emailMessage.deleteMany({
      where: { thread: { orgId } }
    });

    // Delete all email attachments (should cascade from messages, but being explicit)
    const attachmentsDeleted = await prisma.emailAttachment.deleteMany({
      where: { message: { thread: { orgId } } }
    });

    const result = {
      success: true,
      message: 'All emails and calendar events cleared successfully',
      emailsDeleted: emailThreadsDeleted.count,
      eventsDeleted: calendarEventsDeleted.count,
      messagesDeleted: emailMessagesDeleted.count,
      attachmentsDeleted: attachmentsDeleted.count
    };

    logger.info('Clear all operation completed', result);

    return NextResponse.json(result);

  } catch (error) {
    logger.error('Clear all operation failed', { error });
    return NextResponse.json(
      { 
        error: 'Failed to clear emails and events',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}