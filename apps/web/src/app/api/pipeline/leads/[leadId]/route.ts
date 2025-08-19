import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { handleStageChange } from '@/server/automation';

export const dynamic = 'force-dynamic';

/**
 * Update lead (mainly for stage changes from DnD)
 */
export async function PATCH(req: NextRequest, { params }: { params: { leadId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { leadId } = params;
    const body = await req.json();

    // Skip demo leads
    if (leadId.startsWith('demo-')) {
      return NextResponse.json({ success: true });
    }

    // Verify lead exists and belongs to org
    const existingLead = await prisma.lead.findFirst({
      where: { id: leadId, orgId }
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updateData: unknown = { updatedAt: new Date() };

    // Handle stage change
    if (body.stage && body.stage !== existingLead.stageId) {
      // Verify new stage exists and belongs to org
      const newStage = await prisma.pipelineStage.findFirst({
        where: { id: body.stage, orgId }
      });

      if (!newStage) {
        return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
      }

      updateData.stageId = body.stage;

      // Log the stage change activity
      await prisma.leadActivity.create({
        data: {
          leadId,
          orgId,
          type: 'note',
          description: `Lead moved to ${newStage.name}`,
          createdBy: session.user.email
        }
      });

      if (existingLead.automationEnabled) {
        await handleStageChange(orgId, leadId);
      }
    }

    // Handle other updates
    if (body.title !== undefined) updateData.title = body.title;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.contact !== undefined) updateData.contact = body.contact;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.value !== undefined) updateData.value = body.value;
    if (body.probability !== undefined) updateData.probability = body.probability;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.automationEnabled !== undefined) updateData.automationEnabled = body.automationEnabled;

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData
    });

    return NextResponse.json({ success: true, lead: updatedLead });

  } catch (error: unknown) {
    console.error('Lead update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

/**
 * Delete lead
 */
export async function DELETE(req: NextRequest, { params }: { params: { leadId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { leadId } = params;

    // Skip demo leads
    if (leadId.startsWith('demo-')) {
      return NextResponse.json({ success: true });
    }

    // Verify lead exists and belongs to org
    const existingLead = await prisma.lead.findFirst({
      where: { id: leadId, orgId }
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Soft delete by updating status
    await prisma.lead.update({
      where: { id: leadId },
      data: { 
        status: 'deleted',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Lead deletion API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
