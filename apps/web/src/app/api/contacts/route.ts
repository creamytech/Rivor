import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { mixWithDemoData, demoContacts } from '@/lib/demo-data';
import { decryptForOrg, encryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';

/**
 * Get contacts for the organization
 */
export async function GET(req: NextRequest) {
  try {
    // Development bypass - return mock data
    if (process.env.NODE_ENV === 'development') {
      const mockContacts = [
        {
          id: 'mock-1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@example.com',
          company: 'Johnson Properties',
          title: 'Real Estate Investor',
          phone: '(555) 123-4567',
          location: '123 Main St, Austin, TX 78701',
          avatarUrl: null,
          starred: true,
          tags: ['hot-lead', 'investor'],
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          emailCount: 5,
          leadCount: 2,
          source: 'email' as const,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'mock-2',
          name: 'Michael Chen',
          email: 'michael.chen@techcorp.com',
          company: 'Tech Corp',
          title: 'VP of Real Estate',
          phone: '(555) 987-6543',
          location: '456 Oak Ave, Dallas, TX 75201',
          avatarUrl: null,
          starred: false,
          tags: ['commercial', 'corporate'],
          lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          emailCount: 12,
          leadCount: 1,
          source: 'manual' as const,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'mock-3',
          name: 'Emma Rodriguez',
          email: 'emma@familyhomes.com',
          company: 'Family Homes LLC',
          title: 'Property Manager',
          phone: '(555) 555-0123',
          location: '789 Pine St, Houston, TX 77001',
          avatarUrl: null,
          starred: false,
          tags: ['residential', 'property-management'],
          lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          emailCount: 8,
          leadCount: 3,
          source: 'import' as const,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'mock-4',
          name: 'David Kim',
          email: 'david.kim@kimrealty.com',
          company: 'Kim Realty Group',
          title: 'Senior Agent',
          phone: '(555) 444-7890',
          location: '321 Elm Dr, San Antonio, TX 78201',
          avatarUrl: null,
          starred: true,
          tags: ['luxury', 'referral-partner'],
          lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          emailCount: 15,
          leadCount: 0,
          source: 'email' as const,
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      return NextResponse.json({
        contacts: mockContacts,
        total: mockContacts.length
      });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const contacts = await prisma.contact.findMany({
      where: { orgId },
      include: {
        _count: {
          select: {
            leads: true
          }
        }
      },
      orderBy: { lastActivity: 'desc' },
      take: limit,
      skip: offset
    });

    const decode = async (blob: Buffer | null | undefined, ctx: string) => {
      if (!blob) return '';
      try {
        const bytes = await decryptForOrg(orgId, blob, ctx);
        return new TextDecoder().decode(bytes);
      } catch {
        return '';
      }
    };

    const contactsFormatted = await Promise.all(
      contacts.map(async contact => ({
        id: contact.id,
        name: await decode(contact.nameEnc as any, 'contact:name'),
        email: await decode(contact.emailEnc as any, 'contact:email'),
        company: await decode(contact.companyEnc as any, 'contact:company'),
        title: await decode(contact.titleEnc as any, 'contact:title'),
        phone: await decode(contact.phoneEnc as any, 'contact:phone'),
        location: await decode(contact.addressEnc as any, 'contact:address'),
        avatarUrl: null,
        starred: false,
        tags: contact.tags || [],
        lastActivity: contact.lastActivity?.toISOString() || contact.createdAt.toISOString(),
        emailCount: 0,
        leadCount: contact._count.leads,
        source: contact.source as 'email' | 'manual' | 'import',
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString()
      }))
    );

    const finalContacts = mixWithDemoData(
      contactsFormatted,
      demoContacts.map(contact => ({
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
      }))
    );

    return NextResponse.json({
      contacts: finalContacts,
      total: finalContacts.length
    });

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

    const [
      nameEnc,
      emailEnc,
      companyEnc,
      titleEnc,
      phoneEnc,
      addressEnc
    ] = await Promise.all([
      encryptForOrg(orgId, name, 'contact:name'),
      encryptForOrg(orgId, email, 'contact:email'),
      company ? encryptForOrg(orgId, company, 'contact:company') : Promise.resolve(null),
      title ? encryptForOrg(orgId, title, 'contact:title') : Promise.resolve(null),
      phone ? encryptForOrg(orgId, phone, 'contact:phone') : Promise.resolve(null),
      location ? encryptForOrg(orgId, location, 'contact:address') : Promise.resolve(null)
    ]);

    const existingContact = await prisma.contact.findFirst({
      where: { orgId, emailEnc }
    });

    if (existingContact) {
      return NextResponse.json(
        { error: 'Contact with this email already exists' },
        { status: 409 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        orgId,
        nameEnc,
        emailEnc,
        companyEnc,
        titleEnc,
        phoneEnc,
        addressEnc,
        tags: tags || [],
        source: 'manual',
        lastActivity: new Date()
      }
    });

    const [decName, decEmail, decCompany, decTitle, decPhone, decLocation] = await Promise.all([
      decryptForOrg(orgId, contact.nameEnc as any, 'contact:name').then(bytes => new TextDecoder().decode(bytes)),
      decryptForOrg(orgId, contact.emailEnc as any, 'contact:email').then(bytes => new TextDecoder().decode(bytes)),
      contact.companyEnc ? decryptForOrg(orgId, contact.companyEnc as any, 'contact:company').then(bytes => new TextDecoder().decode(bytes)) : Promise.resolve(''),
      contact.titleEnc ? decryptForOrg(orgId, contact.titleEnc as any, 'contact:title').then(bytes => new TextDecoder().decode(bytes)) : Promise.resolve(''),
      contact.phoneEnc ? decryptForOrg(orgId, contact.phoneEnc as any, 'contact:phone').then(bytes => new TextDecoder().decode(bytes)) : Promise.resolve(''),
      contact.addressEnc ? decryptForOrg(orgId, contact.addressEnc as any, 'contact:address').then(bytes => new TextDecoder().decode(bytes)) : Promise.resolve('')
    ]);

    return NextResponse.json({
      id: contact.id,
      name: decName,
      email: decEmail,
      company: decCompany,
      title: decTitle,
      phone: decPhone,
      location: decLocation,
      avatarUrl: null,
      starred: false,
      tags: contact.tags || [],
      lastActivity: contact.lastActivity?.toISOString() || contact.createdAt.toISOString(),
      emailCount: 0,
      leadCount: 0,
      source: contact.source as 'email' | 'manual' | 'import',
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString()
    });

  } catch (error: unknown) {
    console.error('Contact creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
