import { prisma } from './db';
import { decryptForOrg } from './crypto';

/**
 * Service to automatically link email threads to pipeline contacts
 */

/**
 * Check if an email thread should be associated with existing pipeline leads
 * This is called during email sync to maintain pipeline-email associations
 */
export async function linkEmailToPipelineContacts(orgId: string, threadId: string) {
  try {
    console.log(`🔗 Checking pipeline associations for thread ${threadId}`);

    // Get the thread with messages to extract participant emails
    const thread = await prisma.emailThread.findFirst({
      where: { 
        id: threadId, 
        orgId 
      },
      include: {
        messages: {
          select: {
            id: true,
            fromEnc: true,
            toEnc: true,
            ccEnc: true,
            bccEnc: true
          },
          take: 1, // Just need one message to get participants
          orderBy: {
            sentAt: 'desc'
          }
        }
      }
    });

    if (!thread || !thread.messages.length) {
      console.log(`❌ Thread ${threadId} not found or has no messages`);
      return { linked: false, reason: 'Thread not found or no messages' };
    }

    // Extract all email addresses from the thread
    const participantEmails = new Set<string>();
    
    for (const message of thread.messages) {
      try {
        // Decrypt FROM email
        if (message.fromEnc) {
          const fromBytes = await decryptForOrg(orgId, message.fromEnc, 'email:from');
          const fromStr = new TextDecoder().decode(fromBytes);
          const emailMatch = fromStr.match(/<([^>]+)>/) || [null, fromStr];
          const email = emailMatch[1] || fromStr;
          participantEmails.add(email.toLowerCase().trim());
        }

        // Decrypt TO emails
        if (message.toEnc) {
          const toBytes = await decryptForOrg(orgId, message.toEnc, 'email:to');
          const toStr = new TextDecoder().decode(toBytes);
          const emails = toStr.split(',').map(email => {
            const emailMatch = email.match(/<([^>]+)>/) || [null, email];
            return (emailMatch[1] || email).toLowerCase().trim();
          });
          emails.forEach(email => participantEmails.add(email));
        }

        // Decrypt CC emails
        if (message.ccEnc) {
          const ccBytes = await decryptForOrg(orgId, message.ccEnc, 'email:cc');
          const ccStr = new TextDecoder().decode(ccBytes);
          const emails = ccStr.split(',').map(email => {
            const emailMatch = email.match(/<([^>]+)>/) || [null, email];
            return (emailMatch[1] || email).toLowerCase().trim();
          });
          emails.forEach(email => participantEmails.add(email));
        }
      } catch (error) {
        console.error('Error decrypting email addresses:', error);
      }
    }

    if (participantEmails.size === 0) {
      console.log(`❌ No participant emails found for thread ${threadId}`);
      return { linked: false, reason: 'No participant emails found' };
    }

    console.log(`📧 Found participant emails:`, Array.from(participantEmails));

    // Find active pipeline leads with contacts that match these email addresses
    const leads = await prisma.lead.findMany({
      where: {
        orgId,
        status: 'active',
        contact: {
          isNot: null
        }
      },
      include: {
        contact: {
          select: {
            id: true,
            emailEnc: true,
            nameEnc: true
          }
        }
      }
    });

    const matchingLeads = [];

    for (const lead of leads) {
      if (!lead.contact?.emailEnc) continue;

      try {
        // Decrypt contact email
        const emailBytes = await decryptForOrg(orgId, lead.contact.emailEnc, 'contact:email');
        const contactEmail = new TextDecoder().decode(emailBytes).toLowerCase().trim();

        // Check if this contact's email is in the thread participants
        if (participantEmails.has(contactEmail)) {
          let contactName = null;
          if (lead.contact.nameEnc) {
            try {
              const nameBytes = await decryptForOrg(orgId, lead.contact.nameEnc, 'contact:name');
              contactName = new TextDecoder().decode(nameBytes);
            } catch (error) {
              console.error('Error decrypting contact name:', error);
            }
          }

          matchingLeads.push({
            leadId: lead.id,
            leadTitle: lead.title,
            contactEmail,
            contactName
          });

          console.log(`✅ Found matching lead: ${lead.title} (${contactEmail})`);
        }
      } catch (error) {
        console.error('Error decrypting contact email:', error);
      }
    }

    if (matchingLeads.length === 0) {
      console.log(`📭 No pipeline leads found for thread participants`);
      return { linked: false, reason: 'No matching pipeline contacts found' };
    }

    // Create pipeline activities for each matching lead
    const activities = [];
    for (const match of matchingLeads) {
      try {
        const activity = await prisma.leadActivity.create({
          data: {
            leadId: match.leadId,
            orgId,
            type: 'email',
            description: `Email thread linked: ${threadId}`,
            metadata: {
              threadId,
              contactEmail: match.contactEmail,
              autoLinked: true,
              linkedAt: new Date().toISOString()
            },
            createdBy: 'system-auto-link'
          }
        });

        activities.push({
          leadId: match.leadId,
          activityId: activity.id,
          leadTitle: match.leadTitle,
          contactName: match.contactName,
          contactEmail: match.contactEmail
        });

        console.log(`📝 Created activity for lead ${match.leadTitle}`);
      } catch (error) {
        console.error(`Error creating activity for lead ${match.leadId}:`, error);
      }
    }

    console.log(`🎯 Successfully linked thread ${threadId} to ${activities.length} pipeline leads`);

    return {
      linked: true,
      threadId,
      matchingLeads: activities.length,
      details: activities
    };

  } catch (error) {
    console.error('Error linking email to pipeline contacts:', error);
    return { 
      linked: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get all email threads associated with a specific pipeline lead
 * This is used by the API endpoint to display threads in pipeline cards
 */
export async function getEmailThreadsForLead(orgId: string, leadId: string) {
  try {
    // Get the lead with contact info
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, orgId },
      include: {
        contact: {
          select: {
            emailEnc: true,
            nameEnc: true
          }
        },
        activities: {
          where: {
            type: 'email',
            metadata: {
              path: ['threadId'],
              not: null
            }
          },
          select: {
            metadata: true
          }
        }
      }
    });

    if (!lead) {
      return { threads: [], contactInfo: { email: null, name: null } };
    }

    // Get contact email for direct thread searching
    let contactEmail = null;
    if (lead.contact?.emailEnc) {
      try {
        const emailBytes = await decryptForOrg(orgId, lead.contact.emailEnc, 'contact:email');
        contactEmail = new TextDecoder().decode(emailBytes).toLowerCase().trim();
      } catch (error) {
        console.error('Error decrypting contact email:', error);
      }
    }

    // Get thread IDs from activities
    const activityThreadIds = lead.activities
      .map(activity => activity.metadata?.threadId)
      .filter(Boolean) as string[];

    console.log(`📧 Found ${activityThreadIds.length} thread IDs from activities for lead ${leadId}`);

    // If we have a contact email, we can also search for threads by participant
    // This will be handled by the API endpoint to avoid duplication

    return {
      contactEmail,
      activityThreadIds,
      totalActivities: lead.activities.length
    };

  } catch (error) {
    console.error('Error getting email threads for lead:', error);
    return { threads: [], contactInfo: { email: null, name: null } };
  }
}

/**
 * Check if a contact email exists in the pipeline and return associated leads
 */
export async function findPipelineLeadsByEmail(orgId: string, email: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find all active leads in this org
    const leads = await prisma.lead.findMany({
      where: {
        orgId,
        status: 'active',
        contact: {
          isNot: null
        }
      },
      include: {
        contact: {
          select: {
            id: true,
            emailEnc: true,
            nameEnc: true
          }
        }
      }
    });

    const matchingLeads = [];

    for (const lead of leads) {
      if (!lead.contact?.emailEnc) continue;

      try {
        const emailBytes = await decryptForOrg(orgId, lead.contact.emailEnc, 'contact:email');
        const contactEmail = new TextDecoder().decode(emailBytes).toLowerCase().trim();

        if (contactEmail === normalizedEmail) {
          let contactName = null;
          if (lead.contact.nameEnc) {
            try {
              const nameBytes = await decryptForOrg(orgId, lead.contact.nameEnc, 'contact:name');
              contactName = new TextDecoder().decode(nameBytes);
            } catch (error) {
              console.error('Error decrypting contact name:', error);
            }
          }

          matchingLeads.push({
            leadId: lead.id,
            leadTitle: lead.title,
            contactEmail,
            contactName,
            stage: lead.stageId,
            priority: lead.priority
          });
        }
      } catch (error) {
        console.error('Error decrypting contact email:', error);
      }
    }

    return matchingLeads;
  } catch (error) {
    console.error('Error finding pipeline leads by email:', error);
    return [];
  }
}