import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { decryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

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

    // Get a few threads to test decryption
    const threads = await prisma.emailThread.findMany({
      where: { orgId },
      select: {
        id: true,
        subjectEnc: true,
        participantsEnc: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 3
    });

    const results = [];
    for (const thread of threads) {
      const result: any = {
        id: thread.id,
        updatedAt: thread.updatedAt,
        subjectEnc: {
          exists: !!thread.subjectEnc,
          type: thread.subjectEnc ? typeof thread.subjectEnc : 'null',
          length: thread.subjectEnc ? (thread.subjectEnc as any).length : 0,
          sample: thread.subjectEnc ? (thread.subjectEnc as any).slice(0, 20) : null
        },
        participantsEnc: {
          exists: !!thread.participantsEnc,
          type: thread.participantsEnc ? typeof thread.participantsEnc : 'null',
          length: thread.participantsEnc ? (thread.participantsEnc as any).length : 0,
          sample: thread.participantsEnc ? (thread.participantsEnc as any).slice(0, 20) : null
        }
      };

      // Try to decrypt
      try {
        if (thread.subjectEnc) {
          const decryptedSubject = await decryptForOrg(orgId, thread.subjectEnc, 'email:subject');
          result.decryptedSubject = {
            success: true,
            length: decryptedSubject.length,
            text: new TextDecoder().decode(decryptedSubject)
          };
        } else {
          result.decryptedSubject = { success: false, reason: 'No encrypted data' };
        }
      } catch (error) {
        result.decryptedSubject = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }

      try {
        if (thread.participantsEnc) {
          const decryptedParticipants = await decryptForOrg(orgId, thread.participantsEnc, 'email:participants');
          result.decryptedParticipants = {
            success: true,
            length: decryptedParticipants.length,
            text: new TextDecoder().decode(decryptedParticipants)
          };
        } else {
          result.decryptedParticipants = { success: false, reason: 'No encrypted data' };
        }
      } catch (error) {
        result.decryptedParticipants = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }

      results.push(result);
    }

    return NextResponse.json({
      success: true,
      orgId,
      threadsTested: results.length,
      results
    });

  } catch (error) {
    console.error('Test decryption error:', error);
    return NextResponse.json(
      {
        error: 'Failed to test decryption',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
