import { prisma } from './db';

function normalizeForIndex(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function indexThread(threadId: string) {
  const t = await prisma.emailThread.findUnique({ where: { id: threadId }, select: { id: true, orgId: true, subjectEnc: true, participantsEnc: true } });
  if (!t) return;
  // Do not decrypt; only derive index from safe sources when available (e.g., provider metadata). Placeholder uses empty indexes.
  const subjectIndex = '';
  const participantsIndex = '';
  await prisma.emailThread.update({ where: { id: threadId }, data: { subjectIndex, participantsIndex } });
}

export async function indexLead(leadId: string) {
  await prisma.lead.update({ where: { id: leadId }, data: { nameIndex: '', emailIndex: '' } });
}


