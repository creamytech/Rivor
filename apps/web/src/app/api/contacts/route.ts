import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { mixWithDemoData, demoContacts } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

/**
 * Get contacts for the organization
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search');
    const filter = url.searchParams.get('filter');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const whereClause: unknown = { orgId };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add category filters
    if (filter) {
      switch (filter) {
        case 'starred':
          whereClause.starred = true;
          break;
        case 'with-leads':
          whereClause.leads = { some: {} };
          break;
        case 'recent':
          whereClause.lastActivityAt = {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          };
          break;
      }
    }

    // Get contacts with aggregated data
    const contacts = await prisma.contact.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            emailMessages: true,
            leads: true
          }
        }
      },
      orderBy: { lastActivityAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Transform to UI format
    const contactsFormatted = contacts.map(contact => ({
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
    }));

    // Mix with demo data if enabled
    const finalContacts = mixWithDemoData(contactsFormatted, demoContacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      company: contact.company,
      title: contact.title,
      phone: '',
      location: '',
      avatarUrl: null,
      starred: false,
      tags: [],
      lastActivity: contact.lastActivity,
      emailCount: 1,
      leadCount: 0,
      source: 'email' as const,
      createdAt: contact.lastActivity,
      updatedAt: contact.lastActivity
    })));

    const response = {
      contacts: finalContacts,
      total: finalContacts.length
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Contacts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

/**
 * Create new contact
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await req.json();
    const {
      name,
      email,
      company,
      title,
      phone,
      location,
      tags
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if contact already exists
    const existingContact = await prisma.contact.findFirst({
      where: { email, orgId }
    });

    if (existingContact) {
      return NextResponse.json(
        { error: 'Contact with this email already exists' },
        { status: 409 }
      );
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        orgId,
        name,
        email,
        company: company || null,
        title: title || null,
        phone: phone || null,
        location: location || null,
        tags: tags || [],
        source: 'manual',
        starred: false,
        lastActivityAt: new Date()
      }
    });

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
      emailCount: 0,
      leadCount: 0,
      source: contact.source as 'email' | 'manual' | 'import',
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString()
    };

    return NextResponse.json(contactFormatted);

  } catch (error: unknown) {
    console.error('Contact creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
