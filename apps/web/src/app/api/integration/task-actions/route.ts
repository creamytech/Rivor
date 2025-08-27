import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { encryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';

/**
 * Create tasks with integrated linking to contacts, emails, and calendar events
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const {
      title,
      description,
      priority = 'medium',
      dueAt,
      linkedContactId,
      linkedEmailId,
      linkedThreadId,
      linkedLeadId,
      assignedTo,
      createCalendarEvent,
      calendarEventDetails
    } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Encrypt sensitive data
    const descriptionEnc = description ? await encryptForOrg(orgId, description, 'task:description') : null;

    // Create the task
    const task = await prisma.task.create({
      data: {
        orgId,
        title,
        description: description || null,
        descriptionEnc,
        status: 'pending',
        priority,
        dueAt: dueAt ? new Date(dueAt) : null,
        linkedContactId,
        linkedEmailId,
        linkThreadId: linkedThreadId,
        linkLeadId: linkedLeadId,
        assignedTo,
        createdBy: session.user.email || 'Unknown'
      }
    });

    // Optionally create a calendar event for this task
    let calendarEvent = null;
    if (createCalendarEvent && calendarEventDetails) {
      try {
        const eventResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/calendar/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            title: calendarEventDetails.title || `Task: ${title}`,
            description: `Task: ${title}\n${description || ''}`,
            start: calendarEventDetails.start,
            end: calendarEventDetails.end,
            location: calendarEventDetails.location,
            attendees: calendarEventDetails.attendees || [],
            isAllDay: calendarEventDetails.isAllDay || false,
            type: 'task',
            priority: priority
          })
        });

        if (eventResponse.ok) {
          calendarEvent = await eventResponse.json();
        }
      } catch (error) {
        console.error('Failed to create calendar event for task:', error);
      }
    }

    // Get contact info for response if linked
    let linkedContact = null;
    if (linkedContactId) {
      linkedContact = await prisma.contact.findFirst({
        where: { id: linkedContactId, orgId },
        select: { id: true, nameEnc: true, emailEnc: true }
      });
    }

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt?.toISOString(),
        createdAt: task.createdAt.toISOString(),
        linkedContactId: task.linkedContactId,
        linkedEmailId: task.linkedEmailId,
        linkedThreadId: task.linkThreadId,
        linkedLeadId: task.linkLeadId,
        calendarEvent: calendarEvent?.event || null
      },
      linkedContact: linkedContact ? {
        id: linkedContact.id,
        // We'll decrypt these on the frontend if needed
        hasName: !!linkedContact.nameEnc,
        hasEmail: !!linkedContact.emailEnc
      } : null
    });

  } catch (error) {
    console.error('Failed to create integrated task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

/**
 * Link existing tasks to other entities
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const {
      taskId,
      linkedContactId,
      linkedEmailId,
      linkedThreadId,
      linkedLeadId,
      assignedTo
    } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Update the task with new links
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        linkedContactId: linkedContactId || undefined,
        linkedEmailId: linkedEmailId || undefined,
        linkThreadId: linkedThreadId || undefined,
        linkLeadId: linkedLeadId || undefined,
        assignedTo: assignedTo || undefined,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        linkedContactId: task.linkedContactId,
        linkedEmailId: task.linkedEmailId,
        linkedThreadId: task.linkThreadId,
        linkedLeadId: task.linkLeadId,
        assignedTo: task.assignedTo,
        updatedAt: task.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Failed to update task links:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}