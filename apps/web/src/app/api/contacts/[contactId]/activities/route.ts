import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

/**
 * Get contact activity timeline
 */
export async function GET(req: NextRequest, { params }: { params: { contactId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { contactId } = params;
    const limit = parseInt(new URL(req.url).searchParams.get('limit') || '20');

    // Handle demo contacts
    if (contactId.startsWith('demo-')) {
      const demoActivities = [
        {
          id: 'demo-activity-1',
          type: 'email',
          title: 'Email received',
          description: 'Received email about partnership opportunity',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          linkedEmailId: 'demo-email-1'
        },
        {
          id: 'demo-activity-2',
          type: 'lead_created',
          title: 'Lead created',
          description: 'Lead created from email conversation',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          linkedLeadId: 'demo-lead-1'
        },
        {
          id: 'demo-activity-3',
          type: 'email',
          title: 'Email sent',
          description: 'Sent follow-up email with proposal',
          date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          linkedEmailId: 'demo-email-2'
        }
      ];
      
      return NextResponse.json({ activities: demoActivities });
    }

    // Get contact activities from different sources
    const [emailActivities, leadActivities, contactActivities] = await Promise.all([
      // Email activities
      prisma.emailMessage.findMany({
        where: {
          OR: [
            { fromEmail: { in: await getContactEmails(contactId, orgId) } },
            { toEmails: { contains: await getContactEmails(contactId, orgId) } }
          ],
          orgId
        },
        select: {
          id: true,
          subject: true,
          fromEmail: true,
          sentAt: true,
          createdAt: true
        },
        orderBy: { sentAt: 'desc' },
        take: limit
      }),

      // Lead activities  
      prisma.lead.findMany({
        where: {
          contact: { id: contactId },
          orgId
        },
        select: {
          id: true,
          title: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),

      // Direct contact activities (notes, calls, etc.)
      prisma.contactActivity.findMany({
        where: { contactId, orgId },
        orderBy: { createdAt: 'desc' },
        take: limit
      }).catch(() => []) // Table might not exist yet
    ]);

    // Combine and format activities
    const activities: unknown[] = [];

    // Add email activities
    emailActivities.forEach(email => {
      activities.push({
        id: `email-${email.id}`,
        type: 'email',
        title: email.subject || 'Email',
        description: `Email ${email.fromEmail.includes(contactId) ? 'sent' : 'received'}`,
        date: email.sentAt.toISOString(),
        linkedEmailId: email.id
      });
    });

    // Add lead activities
    leadActivities.forEach(lead => {
      activities.push({
        id: `lead-${lead.id}`,
        type: 'lead_created',
        title: 'Lead created',
        description: `Lead "${lead.title}" was created`,
        date: lead.createdAt.toISOString(),
        linkedLeadId: lead.id
      });
    });

    // Add contact activities
    contactActivities.forEach(activity => {
      activities.push({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        date: activity.createdAt.toISOString()
      });
    });

    // Sort by date and limit
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({ activities: limitedActivities });

  } catch (error: unknown) {
    console.error('Contact activities API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact activities' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get contact emails
 */
async function getContactEmails(contactId: string, orgId: string): Promise<string[]> {
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, orgId },
      select: { email: true }
    });
    
    return contact ? [contact.email] : [];
  } catch {
    return [];
  }
}
