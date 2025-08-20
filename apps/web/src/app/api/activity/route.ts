import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { decryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(_req: NextRequest) {
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
