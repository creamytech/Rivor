import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { decryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';

interface ActivityItem {
  id: string;
  type: 'task' | 'email' | 'calendar' | 'contact';
  action: 'created' | 'updated' | 'completed' | 'sent' | 'received' | 'scheduled';
  title: string;
  description?: string;
  date: string;
  relatedEntity?: {
    id: string;
    type: string;
    name: string;
  };
  metadata?: any;
}

/**
 * Get comprehensive activity timeline across all modules
 */
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

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const entityType = url.searchParams.get('entityType'); // 'contact', 'task', etc.
    const entityId = url.searchParams.get('entityId');
    const days = parseInt(url.searchParams.get('days') || '30');

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const activities: ActivityItem[] = [];

    // Get tasks activity
    const tasks = await prisma.task.findMany({
      where: {
        orgId,
        createdAt: { gte: startDate },
        ...(entityType === 'contact' && entityId && { linkedContactId: entityId })
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 20)
    });

    for (const task of tasks) {
      activities.push({
        id: task.id,
        type: 'task',
        action: task.status === 'completed' ? 'completed' : 'created',
        title: task.title,
        description: task.description || undefined,
        date: (task.status === 'completed' && task.completedAt ? task.completedAt : task.createdAt).toISOString(),
        metadata: {
          status: task.status,
          priority: task.priority,
          dueAt: task.dueAt?.toISOString()
        }
      });
    }

    // Get email threads activity
    const emailThreads = await prisma.emailThread.findMany({
      where: {
        orgId,
        createdAt: { gte: startDate }
      },
      include: {
        messages: {
          take: 1,
          orderBy: { sentAt: 'desc' }
        },
        aiAnalysis: true
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(limit, 20)
    });

    for (const thread of emailThreads) {
      let subject = 'Email Thread';
      if (thread.subjectEnc) {
        try {
          const subjectBytes = await decryptForOrg(orgId, thread.subjectEnc, 'email:subject');
          subject = new TextDecoder().decode(subjectBytes);
        } catch (error) {
          console.warn('Failed to decrypt email subject:', error);
        }
      }

      // Check if this thread relates to the requested entity
      let includeThread = !entityType || !entityId;
      
      if (entityType === 'contact' && entityId && thread.participantsEnc) {
        try {
          // Get the contact's email to match against thread participants
          const contact = await prisma.contact.findFirst({
            where: { id: entityId, orgId }
          });
          
          if (contact?.emailEnc) {
            const contactEmailBytes = await decryptForOrg(orgId, contact.emailEnc, 'contact:email');
            const contactEmail = new TextDecoder().decode(contactEmailBytes);
            
            const participantsBytes = await decryptForOrg(orgId, thread.participantsEnc, 'email:participants');
            const participants = new TextDecoder().decode(participantsBytes);
            
            includeThread = participants.toLowerCase().includes(contactEmail.toLowerCase());
          }
        } catch (error) {
          console.warn('Failed to match thread participants:', error);
        }
      }

      if (includeThread) {
        activities.push({
          id: thread.id,
          type: 'email',
          action: 'received',
          title: subject,
          description: thread.aiAnalysis ? `Category: ${thread.aiAnalysis.category}` : undefined,
          date: thread.updatedAt.toISOString(),
          metadata: {
            category: thread.aiAnalysis?.category,
            messageCount: thread.messages.length,
            priorityScore: thread.aiAnalysis?.priorityScore
          }
        });
      }
    }

    // Get calendar events activity
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: {
        orgId,
        start: { gte: startDate }
      },
      orderBy: { start: 'desc' },
      take: Math.min(limit, 20)
    });

    for (const event of calendarEvents) {
      let title = 'Calendar Event';
      if (event.titleEnc) {
        try {
          const titleBytes = await decryptForOrg(orgId, event.titleEnc, 'calendar:title');
          title = new TextDecoder().decode(titleBytes);
        } catch (error) {
          console.warn('Failed to decrypt calendar title:', error);
        }
      }

      let includeEvent = !entityType || !entityId;
      
      // Check if this event relates to the requested entity
      if (entityType === 'contact' && entityId && event.attendeesEnc) {
        try {
          const contact = await prisma.contact.findFirst({
            where: { id: entityId, orgId }
          });
          
          if (contact?.emailEnc) {
            const contactEmailBytes = await decryptForOrg(orgId, contact.emailEnc, 'contact:email');
            const contactEmail = new TextDecoder().decode(contactEmailBytes);
            
            const attendeesBytes = await decryptForOrg(orgId, event.attendeesEnc, 'calendar:attendees');
            const attendees = JSON.parse(new TextDecoder().decode(attendeesBytes));
            
            includeEvent = attendees.some((email: string) => 
              email.toLowerCase() === contactEmail.toLowerCase());
          }
        } catch (error) {
          console.warn('Failed to match event attendees:', error);
        }
      }

      if (includeEvent) {
        const isPast = event.start < new Date();
        activities.push({
          id: event.id,
          type: 'calendar',
          action: isPast ? 'completed' : 'scheduled',
          title,
          description: `${event.start.toLocaleString()} - ${event.end.toLocaleString()}`,
          date: event.start.toISOString(),
          metadata: {
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            isPast
          }
        });
      }
    }

    // Get contacts activity (recently created/updated)
    if (!entityType || entityType === 'contact') {
      const contacts = await prisma.contact.findMany({
        where: {
          orgId,
          ...(entityId && { id: entityId }),
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 10)
      });

      for (const contact of contacts) {
        let name = 'Contact';
        if (contact.nameEnc) {
          try {
            const nameBytes = await decryptForOrg(orgId, contact.nameEnc, 'contact:name');
            name = new TextDecoder().decode(nameBytes);
          } catch (error) {
            console.warn('Failed to decrypt contact name:', error);
          }
        }

        activities.push({
          id: contact.id,
          type: 'contact',
          action: 'created',
          title: `Contact created: ${name}`,
          date: contact.createdAt.toISOString()
        });
      }
    }

    // Sort all activities by date (most recent first)
    const sortedActivities = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    // Group activities by date for better presentation
    const groupedActivities = sortedActivities.reduce((groups, activity) => {
      const date = new Date(activity.date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
      return groups;
    }, {} as Record<string, ActivityItem[]>);

    return NextResponse.json({
      activities: sortedActivities,
      groupedActivities,
      stats: {
        total: activities.length,
        tasks: activities.filter(a => a.type === 'task').length,
        emails: activities.filter(a => a.type === 'email').length,
        calendar: activities.filter(a => a.type === 'calendar').length,
        contacts: activities.filter(a => a.type === 'contact').length,
        timeframe: `${days} days`,
        generated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Failed to get activity timeline:', error);
    return NextResponse.json(
      { error: 'Failed to get activity timeline' },
      { status: 500 }
    );
  }
}