import { prisma } from './db';
import { GmailService } from './gmail';
import { decryptForOrg } from './crypto';
import { logger } from '@/lib/logger';

/**
 * Send a templated follow-up email for a lead using the org's first Gmail account
 */
export async function sendFollowUpEmail(orgId: string, leadId: string, template: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { contact: true }
  });
  if (!lead || !lead.contact?.emailEnc) return;

  try {
    const emailBytes = await decryptForOrg(orgId, lead.contact.emailEnc as unknown as Buffer, 'contact:email');
    const to = new TextDecoder().decode(emailBytes);

    const account = await prisma.emailAccount.findFirst({
      where: { orgId, provider: 'google' }
    });
    if (!account) {
      logger.warn('No Gmail account available for org', { orgId });
      return;
    }

    const gmail = await GmailService.createFromAccount(orgId, account.id);
    await gmail.sendEmail({
      to,
      subject: lead.title ? `Re: ${lead.title}` : 'Following up',
      body: template.replace('{{leadTitle}}', lead.title || ''),
      isHtml: false
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: { lastFollowUpAt: new Date() }
    });
  } catch (err) {
    logger.error('Failed to send follow-up email', {
      orgId,
      leadId,
      error: err instanceof Error ? err.message : String(err)
    });
  }
}

/**
 * Handle stage change automation. Sends a quick email acknowledging progress.
 */
export async function handleStageChange(orgId: string, leadId: string) {
  await sendFollowUpEmail(
    orgId,
    leadId,
    'Thanks for the update on {{leadTitle}}. Let me know if you have any questions as we move forward.'
  );
}

/**
 * Check for stagnant leads (updated >7 days ago) and send follow-ups.
 */
export async function checkStagnantLeads(orgId: string) {
  const staleDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const leads = await prisma.lead.findMany({
    where: {
      orgId,
      status: 'active',
      automationEnabled: true,
      updatedAt: { lt: staleDate }
    }
  });

  for (const lead of leads) {
    if (lead.lastFollowUpAt && lead.lastFollowUpAt > staleDate) continue;
    await sendFollowUpEmail(
      orgId,
      lead.id,
      'Just checking in about {{leadTitle}}. Let me know if you are still interested.'
    );
  }
}
