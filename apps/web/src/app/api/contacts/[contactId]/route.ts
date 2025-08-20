import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Get specific contact details
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

    // Handle demo contacts
    if (contactId.startsWith('demo-')) {
      const demoContact = {
        id: contactId,
        name: 'Demo Contact',
        email: 'demo@example.com',
        company: 'Demo Company',
        title: 'Demo Title',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        avatarUrl: null,
        starred: false,
        tags: ['demo', 'sample'],
        lastActivity: new Date().toISOString(),
        emailCount: 3,
        leadCount: 1,
        source: 'email' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return NextResponse.json(demoContact);
    }

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, orgId },
      include: {
        _count: {
          select: {
            emailMessages: true,
            leads: true
          }
        }
      }
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Transform to UI format
    const contactFormatted = {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      company: contact.company,
      title: contact.title,
      phone: contact.phone,
      location: contact.location,
      avatarUrl: contact.avatarUrl,
      starred: contact.starred,
      tags: contact.tags || [],
      lastActivity: contact.lastActivityAt?.toISOString() || contact.createdAt.toISOString(),
      emailCount: contact._count.emailMessages,
      leadCount: contact._count.leads,
      source: contact.source as 'email' | 'manual' | 'import',
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString()
    };

    return NextResponse.json(contactFormatted);

  } catch (error: unknown) {
    console.error('Contact detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

/**
 * Update contact
 */
export async function PATCH(req: NextRequest, { params }: { params: { contactId: string } }) {
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
    const body = await req.json();

    // Skip demo contacts
    if (contactId.startsWith('demo-')) {
      return NextResponse.json({ success: true });
    }

    // Verify contact exists and belongs to org
    const existingContact = await prisma.contact.findFirst({
      where: { id: contactId, orgId }
    });

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const updateData: unknown = { updatedAt: new Date() };

    // Handle specific updates
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.starred !== undefined) updateData.starred = body.starred;

    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: updateData
    });

    return NextResponse.json({ success: true, contact: updatedContact });

  } catch (error: unknown) {
    console.error('Contact update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

/**
 * Delete contact
 */
export async function DELETE(req: NextRequest, { params }: { params: { contactId: string } }) {
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

    // Skip demo contacts
    if (contactId.startsWith('demo-')) {
      return NextResponse.json({ success: true });
    }

    // Verify contact exists and belongs to org
    const existingContact = await prisma.contact.findFirst({
      where: { id: contactId, orgId }
    });

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Soft delete by updating status or hard delete based on requirements
    await prisma.contact.delete({
      where: { id: contactId }
    });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Contact deletion API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
