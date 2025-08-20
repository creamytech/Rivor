import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { GmailService } from '@/server/gmail';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { emailAccountId, limit = 10 } = body;

    if (!emailAccountId) {
      return NextResponse.json({ error: "emailAccountId is required" }, { status: 400 });
    }

    logger.info('Fixing email encryption for existing messages', { 
      userEmail, 
      orgId, 
      emailAccountId,
      limit 
    });

    // Get the email account
    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId, orgId }
    });

    if (!emailAccount) {
      return NextResponse.json({ error: "Email account not found" }, { status: 404 });
    }

    if (emailAccount.provider !== 'google') {
      return NextResponse.json({ error: "Only Google accounts supported for now" }, { status: 400 });
    }

    // Get messages that don't have encrypted content
    const messagesToFix = await prisma.emailMessage.findMany({
      where: { 
        orgId,
        thread: {
          accountId: emailAccountId
        },
        OR: [
          { bodyRefEnc: null },
          { fromEnc: null },
          { toEnc: null },
          { subjectEnc: null }
        ]
      },
      select: {
        id: true,
        messageId: true,
        subjectIndex: true,
        threadId: true
      },
      take: limit
    });

    if (messagesToFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No messages found that need encryption fixes",
        fixedCount: 0
      });
    }

    // Create Gmail service
    const gmailService = await GmailService.createFromAccount(orgId, emailAccountId);
    
    let fixedCount = 0;
    let errorCount = 0;

    for (const message of messagesToFix) {
      try {
        // Re-process the message to get proper encryption
        await gmailService.processMessage(orgId, emailAccountId, message.messageId);
        fixedCount++;
        
        logger.info('Fixed message encryption', { 
          messageId: message.messageId,
          fixedCount 
        });
      } catch (error) {
        errorCount++;
        logger.error('Failed to fix message encryption', { 
          messageId: message.messageId, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed encryption for ${fixedCount} messages`,
      fixedCount,
      errorCount,
      totalProcessed: messagesToFix.length
    });

  } catch (error) {
    logger.error('Fix email encryption error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return NextResponse.json(
      { error: 'Fix email encryption failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
