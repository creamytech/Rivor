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
  const lead = await prisma.lead.findUnique({ 
    where: { id: leadId }, 
    select: { id: true, orgId: true }
  });
  if (!lead) return;
  
  // Note: Lead model doesn't have indexable fields in current schema
  // This function is kept for future indexing needs
  // For now, we just validate the lead exists
  console.log(`Lead ${leadId} validation completed`);
}

export async function indexContact(contactId: string) {
  const contact = await prisma.contact.findUnique({ 
    where: { id: contactId }, 
    select: { id: true, orgId: true, nameEnc: true, emailEnc: true, companyEnc: true }
  });
  if (!contact) return;
  
  // Do not decrypt; only derive index from safe sources when available
  // For now, use empty indexes as placeholder until proper decryption is implemented
  const nameIndex = '';
  const emailIndex = '';
  const companyIndex = '';
  
  await prisma.contact.update({ 
    where: { id: contactId }, 
    data: { nameIndex, emailIndex, companyIndex } 
  });
}


