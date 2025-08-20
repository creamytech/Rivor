import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
// Removed demo data imports - now using real data only

export const dynamic = 'force-dynamic';

/**
 * Get pipeline stages with leads
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

    // Get pipeline stages
    let stages = await prisma.pipelineStage.findMany({
      where: { orgId },
      include: {
        leads: {
          include: {
            activities: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          },
          orderBy: { updatedAt: 'desc' }
        }
      },
      orderBy: { position: 'asc' }
    });

    // Create default stages if none exist
    if (stages.length === 0) {
      const defaultStages = [
        { name: 'Prospect', color: '#6b7280', position: 0 },
        { name: 'Qualified', color: '#3b82f6', position: 1 },
        { name: 'Proposal', color: '#f59e0b', position: 2 },
        { name: 'Negotiation', color: '#8b5cf6', position: 3 },
        { name: 'Closed Won', color: '#10b981', position: 4 },
        { name: 'Closed Lost', color: '#ef4444', position: 5 }
      ];

      for (const stage of defaultStages) {
        await prisma.pipelineStage.create({
          data: {
            ...stage,
            orgId
          }
        });
      }

      // Refetch stages
      stages = await prisma.pipelineStage.findMany({
        where: { orgId },
        include: {
          leads: {
            include: {
              activities: {
                orderBy: { createdAt: 'desc' },
                take: 5
              }
            },
            orderBy: { updatedAt: 'desc' }
          }
        },
        orderBy: { position: 'asc' }
      });
    }

    // Transform to UI format
    const stagesFormatted = stages.map(stage => ({
      id: stage.id,
      name: stage.name,
      color: stage.color,
      position: stage.position,
      recentActivity: stage.leads.some(lead => 
        lead.activities.some(activity => 
          new Date(activity.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
        )
      ),
      leads: stage.leads.map(lead => ({
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
        automationEnabled: lead.automationEnabled,
        tags: lead.tags || [],
        threadId: lead.threadId,
        activities: lead.activities.map(activity => ({
          id: activity.id,
          type: activity.type as 'email' | 'call' | 'meeting' | 'note' | 'task',
          description: activity.description,
          createdAt: activity.createdAt.toISOString(),
          linkedEmailId: activity.linkedEmailId
        }))
      }))
    }));

    // Note: No demo data mixing - showing real pipeline data only

    const response = {
      stages: stagesFormatted
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Pipeline stages API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline stages' },
      { status: 500 }
    );
  }
}
