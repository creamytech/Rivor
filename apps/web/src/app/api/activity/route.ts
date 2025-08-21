import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { decryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(_req: NextRequest) {
  // Development bypass - return mock data
  if (process.env.NODE_ENV === 'development') {
    const mockActivities = [
      {
        id: 'activity-1',
        type: 'email',
        title: 'New inquiry from Sarah Johnson',
        description: 'Interested in downtown investment property - sent initial property details',
        date: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      },
      {
        id: 'activity-2',
        type: 'call',
        title: 'Phone call with Michael Chen',
        description: 'Discussed commercial office space requirements - 10,000 sq ft needed',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        id: 'activity-3',
        type: 'meeting',
        title: 'Property showing scheduled',
        description: 'Emma Rodriguez - family home viewing at 789 Pine St',
        date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
      },
      {
        id: 'activity-4',
        type: 'task',
        title: 'Market analysis completed',
        description: 'Prepared CMA report for residential properties in Houston area',
        date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
      },
      {
        id: 'activity-5',
        type: 'email',
        title: 'Contract documents sent',
        description: 'Purchase agreement sent to Emma Rodriguez for family home',
        date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
      },
      {
        id: 'activity-6',
        type: 'lead',
        title: 'Lead status updated',
        description: 'David Kim moved to "Closed Won" - luxury condo sale completed',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        id: 'activity-7',
        type: 'meeting',
        title: 'Client consultation',
        description: 'Initial meeting with new client about investment portfolio',
        date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        id: 'activity-8',
        type: 'email',
        title: 'Follow-up email sent',
        description: 'Property investment opportunities shared with Johnson Properties',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        id: 'activity-9',
        type: 'task',
        title: 'Listing photos updated',
        description: 'Professional photos uploaded for luxury condo listing',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days ago
      },
      {
        id: 'activity-10',
        type: 'call',
        title: 'Referral partner call',
        description: 'Monthly check-in with Kim Realty Group about mutual referrals',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
      }
    ];

    return NextResponse.json({ activities: mockActivities });
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orgId = (session as { orgId?: string }).orgId;
  if (!orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const limit = 20;

    const [emails, events, leads, tasks] = await Promise.all([
      prisma.emailMessage.findMany({
        where: { orgId },
        select: { id: true, subjectEnc: true, fromEnc: true, sentAt: true },
        orderBy: { sentAt: 'desc' },
        take: limit,
      }),
      prisma.calendarEvent.findMany({
        where: { orgId },
        select: { id: true, titleEnc: true, start: true },
        orderBy: { start: 'desc' },
        take: limit,
      }),
      prisma.lead.findMany({
        where: { orgId },
        select: { id: true, title: true, company: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.task.findMany({
        where: { orgId },
        select: { id: true, title: true, description: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    const emailActivities = await Promise.all(
      emails.map(async (msg) => {
        let subject = 'Email';
        let from = '';
        try {
          if (msg.subjectEnc) {
            const subjectBytes = await decryptForOrg(orgId, msg.subjectEnc, 'email:subject');
            subject = new TextDecoder().decode(subjectBytes);
          }
          if (msg.fromEnc) {
            const fromBytes = await decryptForOrg(orgId, msg.fromEnc, 'email:from');
            from = new TextDecoder().decode(fromBytes);
          }
        } catch {
          // ignore decryption errors
        }
        return {
          id: `email-${msg.id}`,
          type: 'email',
          title: subject || 'Email',
          description: from ? `From: ${from}` : 'Email message',
          date: msg.sentAt.toISOString(),
        };
      })
    );

    const eventActivities = await Promise.all(
      events.map(async (ev) => {
        let title = 'Calendar event';
        try {
          if (ev.titleEnc) {
            const titleBytes = await decryptForOrg(orgId, ev.titleEnc, 'calendar:title');
            title = new TextDecoder().decode(titleBytes);
          }
        } catch {
          // ignore
        }
        return {
          id: `event-${ev.id}`,
          type: 'meeting',
          title,
          description: 'Scheduled meeting',
          date: ev.start.toISOString(),
        };
      })
    );

    const leadActivities = leads.map((lead) => ({
      id: `lead-${lead.id}`,
      type: 'lead',
      title: lead.title || 'Lead',
      description: lead.company ? `Company: ${lead.company}` : 'Lead created',
      date: lead.createdAt.toISOString(),
    }));

    const taskActivities = tasks.map((task) => ({
      id: `task-${task.id}`,
      type: 'task',
      title: task.title,
      description: task.description || 'Task created',
      date: task.createdAt.toISOString(),
    }));

    const activities = [...emailActivities, ...eventActivities, ...leadActivities, ...taskActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Failed to fetch activity feed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
