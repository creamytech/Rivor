import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { encryptForOrg, decryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';

/**
 * Create new lead
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
      title,
      contactId,
      stage,
      value,
      probability,
      priority,
      source,
      description,
      threadId
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Verify stage exists and belongs to org
    const stageExists = await prisma.pipelineStage.findFirst({
      where: { id: stage, orgId }
    });

    if (!stageExists) {
      return NextResponse.json(
        { error: 'Invalid stage' },
        { status: 400 }
      );
    }

    const dealValueEnc =
      value !== undefined && value !== null
        ? await encryptForOrg(orgId, value.toString(), 'lead:dealValue')
        : null;
    const notesEnc =
      description
        ? await encryptForOrg(orgId, description, 'lead:notes')
        : null;

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        orgId,
        title,
        contactId: contactId || null,
        stageId: stage,
        dealValueEnc,
        probabilityPercent: probability || null,
        notesEnc,
        priority: priority || 'medium',
        source: source || 'manual',
        sourceThreadId: threadId || null,
        status: 'active'
      }
    });

    // Create initial activity
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        orgId,
        type: 'note',
        description: `Lead created ${threadId ? 'from email thread' : 'manually'}`,
        createdBy: session.user.email
      }
    });

    // Transform to UI format
    let decryptedValue: number | null = null;
    if (lead.dealValueEnc) {
      try {
        const dec = await decryptForOrg(orgId, lead.dealValueEnc, 'lead:dealValue');
        const valueStr = new TextDecoder().decode(dec);
        decryptedValue = parseFloat(valueStr);
      } catch {
        decryptedValue = null;
      }
    }

    let decryptedNotes: string | null = null;
    if (lead.notesEnc) {
      try {
        const dec = await decryptForOrg(orgId, lead.notesEnc, 'lead:notes');
        decryptedNotes = new TextDecoder().decode(dec);
      } catch {
        decryptedNotes = null;
      }
    }

    const leadFormatted = {
      id: lead.id,
      title: lead.title,
      value: decryptedValue,
      probability: lead.probabilityPercent,
      stage: lead.stageId,
      priority: lead.priority as 'low' | 'medium' | 'high',
      source: lead.source,
      description: decryptedNotes,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      threadId: lead.sourceThreadId,
      activities: []
    };

    return NextResponse.json(leadFormatted);

  } catch (error: unknown) {
    console.error('Lead creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}
