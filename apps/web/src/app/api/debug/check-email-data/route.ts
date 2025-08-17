import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { decryptForOrg } from '@/server/crypto';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get email accounts
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        email: true,
        status: true,
        lastSyncedAt: true
      }
    });

    // Get sample threads with all fields
    const sampleThreads = await prisma.emailThread.findMany({
      where: { orgId },
      select: {
        id: true,
        subjectIndex: true,
        participantsIndex: true,
        subjectEnc: true,
        participantsEnc: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    // Get sample messages
    const sampleMessages = await prisma.emailMessage.findMany({
      where: { orgId },
      select: {
        id: true,
        messageId: true,
        subjectIndex: true,
        participantsIndex: true,
        subjectEnc: true,
        fromEnc: true,
        toEnc: true,
        sentAt: true,
        createdAt: true
      },
      orderBy: { sentAt: 'desc' },
      take: 3
    });

    // Try to decrypt some sample data
    const decryptedSamples = [];
    for (const message of sampleMessages.slice(0, 2)) {
      try {
        let decryptedSubject = 'Could not decrypt';
        let decryptedFrom = 'Could not decrypt';
        let decryptedTo = 'Could not decrypt';

        if (message.subjectEnc) {
          const subjectBytes = await decryptForOrg(orgId, message.subjectEnc, 'email:subject');
          decryptedSubject = new TextDecoder().decode(subjectBytes);
        }

        if (message.fromEnc) {
          const fromBytes = await decryptForOrg(orgId, message.fromEnc, 'email:from');
          decryptedFrom = new TextDecoder().decode(fromBytes);
        }

        if (message.toEnc) {
          const toBytes = await decryptForOrg(orgId, message.toEnc, 'email:to');
          decryptedTo = new TextDecoder().decode(toBytes);
        }

        decryptedSamples.push({
          messageId: message.messageId,
          subjectIndex: message.subjectIndex,
          participantsIndex: message.participantsIndex,
          decryptedSubject,
          decryptedFrom,
          decryptedTo,
          sentAt: message.sentAt
        });
      } catch (error) {
        decryptedSamples.push({
          messageId: message.messageId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      orgId,
      emailAccounts,
      sampleThreads: sampleThreads.map(thread => ({
        id: thread.id,
        subjectIndex: thread.subjectIndex,
        participantsIndex: thread.participantsIndex,
        hasSubjectEnc: !!thread.subjectEnc,
        hasParticipantsEnc: !!thread.participantsEnc,
        messageCount: thread._count.messages,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt
      })),
      sampleMessages: sampleMessages.map(msg => ({
        id: msg.id,
        messageId: msg.messageId,
        subjectIndex: msg.subjectIndex,
        participantsIndex: msg.participantsIndex,
        hasSubjectEnc: !!msg.subjectEnc,
        hasFromEnc: !!msg.fromEnc,
        hasToEnc: !!msg.toEnc,
        sentAt: msg.sentAt
      })),
      decryptedSamples,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to check email data:', error);
    return NextResponse.json(
      { error: 'Failed to check email data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
