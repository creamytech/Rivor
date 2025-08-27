import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { decryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';

/**
 * Get all related data for a contact (tasks, emails, calendar events)
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
    const contactId = url.searchParams.get('contactId');
    const contactEmail = url.searchParams.get('email');

    if (!contactId && !contactEmail) {
      return NextResponse.json({ error: 'Contact ID or email required' }, { status: 400 });
    }

    // Find contact
    let contact;
    if (contactId) {
      contact = await prisma.contact.findFirst({
        where: { id: contactId, orgId }
      });
    } else if (contactEmail) {
      // Find by decrypted email - this is more complex, we'll search through contacts
      const contacts = await prisma.contact.findMany({
        where: { orgId },
        select: { id: true, emailEnc: true }
      });

      for (const c of contacts) {
        if (c.emailEnc) {
          try {
            const emailBytes = await decryptForOrg(orgId, c.emailEnc, 'contact:email');
            const email = new TextDecoder().decode(emailBytes);
            if (email.toLowerCase() === contactEmail.toLowerCase()) {
              contact = await prisma.contact.findFirst({
                where: { id: c.id, orgId }
              });
              break;
            }
          } catch (error) {
            console.warn(`Failed to decrypt email for contact ${c.id}:`, error);
          }
        }
      }
    }

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Get related tasks
    const tasks = await prisma.task.findMany({
      where: {
        orgId,
        linkedContactId: contact.id
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get related email threads by participant matching
    const emailThreads = await prisma.emailThread.findMany({
      where: {
        orgId,
        // We'll need to decrypt and match participants
      },
      include: {
        messages: {
          take: 1,
          orderBy: { sentAt: 'desc' }
        },
        aiAnalysis: true
      },
      take: 10,
      orderBy: { updatedAt: 'desc' }
    });

    // Filter email threads by participant matching (decrypt and check)
    const matchingThreads = [];
    let contactEmailDecrypted = '';
    
    if (contact.emailEnc) {
      try {
        const emailBytes = await decryptForOrg(orgId, contact.emailEnc, 'contact:email');
        contactEmailDecrypted = new TextDecoder().decode(emailBytes);
      } catch (error) {
        console.warn('Failed to decrypt contact email:', error);
      }
    }

    if (contactEmailDecrypted) {
      for (const thread of emailThreads) {
        if (thread.participantsEnc) {
          try {
            const participantsBytes = await decryptForOrg(orgId, thread.participantsEnc, 'email:participants');
            const participants = new TextDecoder().decode(participantsBytes);
            if (participants.toLowerCase().includes(contactEmailDecrypted.toLowerCase())) {
              matchingThreads.push(thread);
            }
          } catch (error) {
            console.warn(`Failed to decrypt participants for thread ${thread.id}:`, error);
          }
        }
      }
    }

    // Get calendar events (future functionality - would need participant matching)
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: {
        orgId,
        start: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      },
      orderBy: { start: 'desc' },
      take: 10
    });

    // Filter calendar events by attendee matching
    const matchingEvents = [];
    if (contactEmailDecrypted) {
      for (const event of calendarEvents) {
        if (event.attendeesEnc) {
          try {
            const attendeesBytes = await decryptForOrg(orgId, event.attendeesEnc, 'calendar:attendees');
            const attendees = new TextDecoder().decode(attendeesBytes);
            const attendeesList = JSON.parse(attendees);
            
            if (attendeesList.some((email: string) => 
              email.toLowerCase() === contactEmailDecrypted.toLowerCase())) {
              matchingEvents.push(event);
            }
          } catch (error) {
            console.warn(`Failed to decrypt attendees for event ${event.id}:`, error);
          }
        }
      }
    }

    // Decrypt contact data
    let name = 'Unknown Contact';
    let email = contactEmailDecrypted || 'Unknown Email';
    let company = '';

    if (contact.nameEnc) {
      try {
        const nameBytes = await decryptForOrg(orgId, contact.nameEnc, 'contact:name');
        name = new TextDecoder().decode(nameBytes);
      } catch (error) {
        console.warn('Failed to decrypt contact name:', error);
      }
    }

    if (contact.companyEnc) {
      try {
        const companyBytes = await decryptForOrg(orgId, contact.companyEnc, 'contact:company');
        company = new TextDecoder().decode(companyBytes);
      } catch (error) {
        console.warn('Failed to decrypt contact company:', error);
      }
    }

    return NextResponse.json({
      contact: {
        id: contact.id,
        name,
        email,
        company
      },
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt?.toISOString(),
        createdAt: task.createdAt.toISOString()
      })),
      emailThreads: matchingThreads.map(thread => ({
        id: thread.id,
        subject: thread.subjectEnc ? '[Encrypted]' : 'No Subject',
        updatedAt: thread.updatedAt.toISOString(),
        messageCount: thread.messages.length,
        category: thread.aiAnalysis?.category || null
      })),
      calendarEvents: matchingEvents.map(event => ({
        id: event.id,
        title: event.titleEnc ? '[Encrypted Event]' : 'Event',
        start: event.start.toISOString(),
        end: event.end.toISOString()
      }))
    });

  } catch (error) {
    console.error('Failed to get contact relations:', error);
    return NextResponse.json(
      { error: 'Failed to get contact relations' },
      { status: 500 }
    );
  }
}