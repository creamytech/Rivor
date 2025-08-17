import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { decryptForOrg } from '@/server/crypto';
import { logger } from '@/lib/logger';

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

    // Get messages that need index fixing
    const messagesToFix = await prisma.emailMessage.findMany({
      where: { 
        orgId,
        OR: [
          { subjectIndex: null },
          { subjectIndex: '' },
          { participantsIndex: null },
          { participantsIndex: '' }
        ]
      },
      select: {
        id: true,
        messageId: true,
        subjectIndex: true,
        participantsIndex: true,
        subjectEnc: true,
        fromEnc: true,
        toEnc: true,
        ccEnc: true,
        bccEnc: true
      },
      take: 50 // Limit to avoid timeouts
    });

    if (messagesToFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No messages found that need index fixing'
      });
    }

    const fixResults = [];
    
    for (const message of messagesToFix) {
      try {
        let newSubjectIndex = message.subjectIndex;
        let newParticipantsIndex = message.participantsIndex;

        // Decrypt and update subject index
        if (message.subjectEnc && (!message.subjectIndex || message.subjectIndex === '')) {
          try {
            const subjectBytes = await decryptForOrg(orgId, message.subjectEnc, 'email:subject');
            const subject = new TextDecoder().decode(subjectBytes);
            newSubjectIndex = subject.toLowerCase();
          } catch (error) {
            console.warn(`Failed to decrypt subject for message ${message.id}:`, error);
          }
        }

        // Decrypt and update participants index
        if ((!message.participantsIndex || message.participantsIndex === '') && 
            (message.fromEnc || message.toEnc || message.ccEnc || message.bccEnc)) {
          
          const participants = [];
          
          // Decrypt from field
          if (message.fromEnc) {
            try {
              const fromBytes = await decryptForOrg(orgId, message.fromEnc, 'email:from');
              const from = new TextDecoder().decode(fromBytes);
              participants.push(from);
            } catch (error) {
              console.warn(`Failed to decrypt from for message ${message.id}:`, error);
            }
          }

          // Decrypt to field
          if (message.toEnc) {
            try {
              const toBytes = await decryptForOrg(orgId, message.toEnc, 'email:to');
              const to = new TextDecoder().decode(toBytes);
              participants.push(to);
            } catch (error) {
              console.warn(`Failed to decrypt to for message ${message.id}:`, error);
            }
          }

          // Decrypt cc field
          if (message.ccEnc) {
            try {
              const ccBytes = await decryptForOrg(orgId, message.ccEnc, 'email:cc');
              const cc = new TextDecoder().decode(ccBytes);
              participants.push(cc);
            } catch (error) {
              console.warn(`Failed to decrypt cc for message ${message.id}:`, error);
            }
          }

          // Decrypt bcc field
          if (message.bccEnc) {
            try {
              const bccBytes = await decryptForOrg(orgId, message.bccEnc, 'email:bcc');
              const bcc = new TextDecoder().decode(bccBytes);
              participants.push(bcc);
            } catch (error) {
              console.warn(`Failed to decrypt bcc for message ${message.id}:`, error);
            }
          }

          newParticipantsIndex = participants.join(' ').toLowerCase();
        }

        // Update the message if we have new data
        if (newSubjectIndex !== message.subjectIndex || newParticipantsIndex !== message.participantsIndex) {
          await prisma.emailMessage.update({
            where: { id: message.id },
            data: {
              subjectIndex: newSubjectIndex || message.subjectIndex,
              participantsIndex: newParticipantsIndex || message.participantsIndex
            }
          });

          fixResults.push({
            messageId: message.messageId,
            status: 'success',
            oldSubjectIndex: message.subjectIndex,
            newSubjectIndex,
            oldParticipantsIndex: message.participantsIndex,
            newParticipantsIndex
          });
        } else {
          fixResults.push({
            messageId: message.messageId,
            status: 'no_change_needed'
          });
        }

      } catch (error) {
        fixResults.push({
          messageId: message.messageId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Also fix thread indexes
    const threadsToFix = await prisma.emailThread.findMany({
      where: { 
        orgId,
        OR: [
          { subjectIndex: null },
          { subjectIndex: '' },
          { participantsIndex: null },
          { participantsIndex: '' }
        ]
      },
      select: {
        id: true,
        subjectIndex: true,
        participantsIndex: true,
        subjectEnc: true,
        participantsEnc: true
      }
    });

    const threadFixResults = [];
    
    for (const thread of threadsToFix) {
      try {
        let newSubjectIndex = thread.subjectIndex;
        let newParticipantsIndex = thread.participantsIndex;

        // Decrypt and update thread subject index
        if (thread.subjectEnc && (!thread.subjectIndex || thread.subjectIndex === '')) {
          try {
            const subjectBytes = await decryptForOrg(orgId, thread.subjectEnc, 'email:subject');
            const subject = new TextDecoder().decode(subjectBytes);
            newSubjectIndex = subject.toLowerCase();
          } catch (error) {
            console.warn(`Failed to decrypt thread subject for thread ${thread.id}:`, error);
          }
        }

        // Decrypt and update thread participants index
        if (thread.participantsEnc && (!thread.participantsIndex || thread.participantsIndex === '')) {
          try {
            const participantsBytes = await decryptForOrg(orgId, thread.participantsEnc, 'email:participants');
            const participants = new TextDecoder().decode(participantsBytes);
            newParticipantsIndex = participants.toLowerCase();
          } catch (error) {
            console.warn(`Failed to decrypt thread participants for thread ${thread.id}:`, error);
          }
        }

        // Update the thread if we have new data
        if (newSubjectIndex !== thread.subjectIndex || newParticipantsIndex !== thread.participantsIndex) {
          await prisma.emailThread.update({
            where: { id: thread.id },
            data: {
              subjectIndex: newSubjectIndex || thread.subjectIndex,
              participantsIndex: newParticipantsIndex || thread.participantsIndex
            }
          });

          threadFixResults.push({
            threadId: thread.id,
            status: 'success',
            oldSubjectIndex: thread.subjectIndex,
            newSubjectIndex,
            oldParticipantsIndex: thread.participantsIndex,
            newParticipantsIndex
          });
        } else {
          threadFixResults.push({
            threadId: thread.id,
            status: 'no_change_needed'
          });
        }

      } catch (error) {
        threadFixResults.push({
          threadId: thread.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Email indexes fixed', {
      orgId,
      messagesFixed: fixResults.filter(r => r.status === 'success').length,
      threadsFixed: threadFixResults.filter(r => r.status === 'success').length,
      totalMessages: messagesToFix.length,
      totalThreads: threadsToFix.length
    });

    return NextResponse.json({
      success: true,
      message: `Fixed indexes for ${fixResults.filter(r => r.status === 'success').length} messages and ${threadFixResults.filter(r => r.status === 'success').length} threads`,
      messageResults: fixResults,
      threadResults: threadFixResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to fix email indexes:', error);
    return NextResponse.json(
      { error: 'Failed to fix email indexes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
