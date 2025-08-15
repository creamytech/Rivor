import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

/**
 * Toggle contact star status
 */
export async function PATCH(req: NextRequest, { params }: { params: { contactId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { contactId } = params;

    // Skip demo contacts
    if (contactId.startsWith('demo-')) {
      return NextResponse.json({ success: true, starred: true });
    }

    // Get current contact
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, orgId },
      select: { starred: true }
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Toggle starred status
    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: { 
        starred: !contact.starred,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      starred: updatedContact.starred 
    });

  } catch (error: any) {
    console.error('Contact star API error:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}
