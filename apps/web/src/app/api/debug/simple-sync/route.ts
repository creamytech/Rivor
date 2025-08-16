import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(__request: NextRequest) {
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

    logger.info('Starting simple sync', { userEmail, orgId });

    // Create some sample email data
    const sampleEmails = [
      {
        subject: 'Welcome to Rivor',
        from: 'team@rivor.com',
        to: userEmail,
        content: 'Welcome to Rivor! We\'re excited to have you on board.',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        subject: 'Meeting Tomorrow',
        from: 'colleague@company.com',
        to: userEmail,
        content: 'Hi! Just wanted to confirm our meeting tomorrow at 2 PM.',
        sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        subject: 'Project Update',
        from: 'manager@company.com',
        to: userEmail,
        content: 'Here\'s the latest update on the project we discussed.',
        sentAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      }
    ];

    let createdCount = 0;

    for (const email of sampleEmails) {
      // Create thread
      const thread = await prisma.emailThread.create({
        data: {
          orgId,
          accountId: 'sample-account',
          subjectIndex: email.subject.toLowerCase(),
          participantsIndex: `${email.from}, ${email.to}`.toLowerCase(),
        }
      });

      // Create message
      await prisma.emailMessage.create({
        data: {
          orgId,
          threadId: thread.id,
          messageId: `sample-${Date.now()}-${createdCount}`,
          sentAt: email.sentAt,
          subjectIndex: email.subject.toLowerCase(),
          participantsIndex: `${email.from}, ${email.to}`.toLowerCase(),
          htmlBody: `<p>${email.content}</p>`,
          textBody: email.content,
          snippet: email.content.substring(0, 100),
        }
      });

      createdCount++;
    }

    logger.info('Simple sync completed', { 
      userEmail, 
      orgId, 
      createdCount 
    });

    return NextResponse.json({ 
      success: true, 
      message: `Created ${createdCount} sample emails`,
      createdCount 
    });

  } catch (error) {
    logger.error('Simple sync error', { error });
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}
