import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

/**
 * Create new lead
 */
export async function POST(_req: NextRequest) {
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
      company,
      contact,
      email,
      value,
      probability,
      stage,
      priority,
      source,
      description,
      tags,
      threadId
    } = body;

    if (!title || !company || !contact) {
      return NextResponse.json(
        { error: 'Title, company, and contact are required' },
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

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        orgId,
        title,
        company,
        contact,
        email: email || null,
        value: value || 0,
        probability: probability || 50,
        stageId: stage,
        priority: priority || 'medium',
        source: source || 'manual',
        description: description || null,
        tags: tags || [],
        threadId: threadId || null,
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
    const leadFormatted = {
      id: lead.id,
      title: lead.title,
      company: lead.company,
      contact: lead.contact,
      email: lead.email,
      value: lead.value,
      probability: lead.probability,
      stage: lead.stageId,
      priority: lead.priority as 'low' | 'medium' | 'high',
      source: lead.source,
      description: lead.description,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      tags: lead.tags || [],
      threadId: lead.threadId,
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
