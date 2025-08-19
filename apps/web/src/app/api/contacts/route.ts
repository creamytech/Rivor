import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { mixWithDemoData, demoContacts } from '@/lib/demo-data';
import { decryptForOrg, encryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';

/**
 * Get contacts for the organization
 */
export async function GET(req: NextRequest) {
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
