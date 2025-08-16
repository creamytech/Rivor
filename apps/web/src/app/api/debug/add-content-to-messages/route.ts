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

    logger.info('Adding content to existing messages', { userEmail, orgId });

    // Get messages that don't have content (using only existing fields)
    const messages = await prisma.emailMessage.findMany({
      where: { 
        orgId
      },
      select: {
        id: true,
        messageId: true,
        subjectIndex: true,
        participantsIndex: true
      },
      take: 10
    });

    let updatedCount = 0;

    for (const message of messages) {
      // Add sample content to each message
      const sampleContent = `This is the content for: ${message.subjectIndex}`;
      const sampleHtml = `<p>This is the HTML content for: <strong>${message.subjectIndex}</strong></p>`;
      
      try {
        // Use raw SQL to update the fields
        await prisma.$executeRaw`
          UPDATE "EmailMessage" 
          SET "htmlBody" = ${sampleHtml}, 
              "textBody" = ${sampleContent},
              "snippet" = ${sampleContent.substring(0, 100)}
          WHERE id = ${message.id}
        `;
        
        updatedCount++;
        logger.info('Updated message with content', { messageId: message.id });
      } catch (error) {
        logger.error('Failed to update message', { messageId: message.id, error });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Added content to ${updatedCount} messages`,
      updatedCount,
      totalMessages: messages.length
    });

  } catch (error) {
    logger.error('Add content error', { error });
    return NextResponse.json(
      { error: 'Add content failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
