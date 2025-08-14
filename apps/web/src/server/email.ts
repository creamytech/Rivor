import { prisma } from './db';
import { decryptForOrg } from './crypto';

export type UiEmailThread = {
  id: string;
  subject: string;
  participants: string;
  updatedAt: Date;
};

export async function listThreads(orgId: string, limit = 50): Promise<UiEmailThread[]> {
  const raws = await prisma.emailThread.findMany({
    where: { orgId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: { id: true, subjectEnc: true, participantsEnc: true, updatedAt: true },
  });
  const out: UiEmailThread[] = [];
  for (const t of raws) {
    let subject = '';
    if (t.subjectEnc) {
      try {
        const dec = await decryptForOrg(orgId, t.subjectEnc, 'email:subject');
        subject = new TextDecoder().decode(dec);
      } catch {
        subject = '(encrypted)';
      }
    }
    let participants = '';
    if (t.participantsEnc) {
      try {
        const dec = await decryptForOrg(orgId, t.participantsEnc, 'email:participants');
        participants = new TextDecoder().decode(dec);
      } catch {
        participants = '';
      }
    }
    out.push({ id: t.id, subject, participants, updatedAt: t.updatedAt });
  }
  return out;
}

export type UiEmailMessage = {
  id: string;
  sentAt: Date;
  from: string;
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  snippet: string;
};

export async function getThreadWithMessages(orgId: string, threadId: string): Promise<{ thread: UiEmailThread | null; messages: UiEmailMessage[] }>{
  const thread = await prisma.emailThread.findUnique({
    where: { id: threadId },
    select: { id: true, orgId: true, subjectEnc: true, participantsEnc: true, updatedAt: true },
  });
  if (!thread || thread.orgId !== orgId) return { thread: null, messages: [] };
  let subject = '';
  let participants = '';
  if (thread.subjectEnc) {
    try { subject = new TextDecoder().decode(await decryptForOrg(orgId, thread.subjectEnc, 'email:subject')); } catch {}
  }
  if (thread.participantsEnc) {
    try { participants = new TextDecoder().decode(await decryptForOrg(orgId, thread.participantsEnc, 'email:participants')); } catch {}
  }
  const msgsRaw = await prisma.emailMessage.findMany({
    where: { threadId },
    orderBy: { sentAt: 'asc' },
    select: { id: true, sentAt: true, fromEnc: true, toEnc: true, ccEnc: true, bccEnc: true, subjectEnc: true, snippetEnc: true },
  });
  const messages: UiEmailMessage[] = [];
  for (const m of msgsRaw) {
    const dec = async (blob?: Buffer, aad?: string) => blob ? new TextDecoder().decode(await decryptForOrg(orgId, blob, aad!)) : '';
    messages.push({
      id: m.id,
      sentAt: m.sentAt,
      from: await dec(m.fromEnc as unknown as Buffer, 'email:from'),
      to: await dec(m.toEnc as unknown as Buffer, 'email:to'),
      cc: await dec(m.ccEnc as unknown as Buffer, 'email:cc'),
      bcc: await dec(m.bccEnc as unknown as Buffer, 'email:bcc'),
      subject: await dec(m.subjectEnc as unknown as Buffer, 'email:subject'),
      snippet: await dec(m.snippetEnc as unknown as Buffer, 'email:snippet'),
    });
  }
  return { thread: { id: thread.id, subject, participants, updatedAt: thread.updatedAt }, messages };
}


