import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(__request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const orgId = (session as { orgId?: string }).orgId;

    if (!orgId || orgId === 'unknown') {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    logger.info('Checking inbox data', { userEmail, orgId });

    // Check threads
    const threads = await prisma.emailThread.findMany({
      where: { orgId },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: {
            id: true,
            subjectIndex: true,
            participantsIndex: true,
            sentAt: true,
            htmlBody: true,
            textBody: true,
            snippet: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    // Check messages directly
    const messages = await prisma.emailMessage.findMany({
      where: { orgId },
      orderBy: { sentAt: 'desc' },
      take: 10,
      select: {
        id: true,
        threadId: true,
        subjectIndex: true,
        participantsIndex: true,
        htmlBody: true,
        textBody: true,
        snippet: true,
        sentAt: true
      }
    });

    return NextResponse.json({
      success: true,
      debug: {
        orgId,
        userEmail,
        threadCount: threads.length,
        messageCount: messages.length,
        threads: threads.map(t => ({
          id: t.id,
          subjectIndex: t.subjectIndex,
          participantsIndex: t.participantsIndex,
          messageCount: t._count.messages,
          latestMessage: t.messages[0] ? {
            id: t.messages[0].id,
            subjectIndex: t.messages[0].subjectIndex,
            participantsIndex: t.messages[0].participantsIndex,
            hasHtmlBody: !!t.messages[0].htmlBody,
            hasTextBody: !!t.messages[0].textBody,
            hasSnippet: !!t.messages[0].snippet
          } : null
        })),
        messages: messages.map(m => ({
          id: m.id,
          threadId: m.threadId,
          subjectIndex: m.subjectIndex,
          participantsIndex: m.participantsIndex,
          hasHtmlBody: !!m.htmlBody,
          hasTextBody: !!m.textBody,
          hasSnippet: !!m.snippet,
          sentAt: m.sentAt
        }))
      }
    });

  } catch (error) {
    logger.error('Check inbox error', { error });
    return NextResponse.json(
      { error: 'Check failed' },
      { status: 500 }
    );
  }
}
