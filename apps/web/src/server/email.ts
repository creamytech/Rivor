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
    select: { 
      id: true, 
      subjectEnc: true, 
      participantsEnc: true, 
      updatedAt: true 
    },
  });
  
  const out: UiEmailThread[] = [];
  for (const t of raws) {
    let subject = '';
    let participants = '';
    
    // Decrypt subject from encrypted field
    if (t.subjectEnc) {
      try {
        const dec = await decryptForOrg(orgId, t.subjectEnc, 'email:subject');
        subject = new TextDecoder().decode(dec);
      } catch {
        subject = '(encrypted)';
      }
    }
    
    // Decrypt participants from encrypted field
    if (t.participantsEnc) {
      try {
        const dec = await decryptForOrg(orgId, t.participantsEnc, 'email:participants');
        participants = new TextDecoder().decode(dec);
      } catch {
        participants = '';
      }
    }
    
    // If still no subject, create one from participants
    if (!subject && participants) {
      const emails = participants.split(',').map(p => p.trim());
      subject = `Email from ${emails[0] || 'Unknown'}`;
    } else if (!subject) {
      subject = '(No subject)';
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
  body: string;
};

export async function getThreadWithMessages(orgId: string, threadId: string): Promise<{ thread: UiEmailThread | null; messages: UiEmailMessage[] }>{
  const thread = await prisma.emailThread.findUnique({
    where: { id: threadId },
    select: { 
      id: true, 
      orgId: true, 
      subjectEnc: true, 
      participantsEnc: true, 
      updatedAt: true 
    },
  });
  if (!thread || thread.orgId !== orgId) return { thread: null, messages: [] };
  
  let subject = '';
  let participants = '';
  
  // Decrypt subject from encrypted field
  if (thread.subjectEnc) {
    try { 
      subject = new TextDecoder().decode(await decryptForOrg(orgId, thread.subjectEnc, 'email:subject')); 
    } catch {}
  }
  
  // Decrypt participants from encrypted field
  if (thread.participantsEnc) {
    try { 
      participants = new TextDecoder().decode(await decryptForOrg(orgId, thread.participantsEnc, 'email:participants')); 
    } catch {}
  }
  
  const msgsRaw = await prisma.emailMessage.findMany({
    where: { threadId },
    orderBy: { sentAt: 'asc' },
    select: { 
      id: true, 
      sentAt: true, 
      fromEnc: true, 
      toEnc: true, 
      ccEnc: true, 
      bccEnc: true, 
      subjectEnc: true, 
      snippetEnc: true,
      bodyRefEnc: true
    },
  });
  
  const messages: UiEmailMessage[] = [];
  for (const m of msgsRaw) {
    // Decrypt message data from encrypted fields
    let messageSubject = '';
    let messageSnippet = '';
    
    if (m.subjectEnc) {
      try {
        messageSubject = new TextDecoder().decode(await decryptForOrg(orgId, m.subjectEnc as unknown as Buffer, 'email:subject'));
      } catch {}
    }
    
    if (m.snippetEnc) {
      // Use encrypted snippet field
      try {
        messageSnippet = new TextDecoder().decode(await decryptForOrg(orgId, m.snippetEnc as unknown as Buffer, 'email:snippet'));
      } catch {}
    }
    
    const dec = async (blob?: Buffer, aad?: string) => blob ? new TextDecoder().decode(await decryptForOrg(orgId, blob, aad!)) : '';
    const body = await dec(m.bodyRefEnc as unknown as Buffer, 'email:body');
    messages.push({
      id: m.id,
      sentAt: m.sentAt,
      from: await dec(m.fromEnc as unknown as Buffer, 'email:from'),
      to: await dec(m.toEnc as unknown as Buffer, 'email:to'),
      cc: await dec(m.ccEnc as unknown as Buffer, 'email:cc'),
      bcc: await dec(m.bccEnc as unknown as Buffer, 'email:bcc'),
      subject: messageSubject,
      snippet: messageSnippet,
      body: body,
    });
  }
  return { thread: { id: thread.id, subject, participants, updatedAt: thread.updatedAt }, messages };
}

/**
 * Get email statistics for an organization
 */
export async function getEmailStats(orgId: string) {
  const [totalThreads, recentThreads] = await Promise.all([
    prisma.emailThread.count({
      where: { orgId }
    }),
    prisma.emailThread.count({
      where: {
        orgId,
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })
  ]);

  return {
    totalThreads,
    recentThreads
  };
}

/**
 * Get unread email count (simplified - in a real implementation you'd track read status)
 */
export async function getUnreadCount(orgId: string): Promise<number> {
  // This is a simplified implementation - in reality you'd track read status
  // For now, we'll just return recent threads as a proxy for "unread"
  const count = await prisma.emailThread.count({
    where: {
      orgId,
      updatedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    }
  });
  
  return count;
}


