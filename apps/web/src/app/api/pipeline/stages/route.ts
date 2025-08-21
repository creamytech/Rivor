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
    // Development bypass - return mock data
    if (process.env.NODE_ENV === 'development') {
      const mockStages = [
        {
          id: 'stage-1',
          name: 'Lead',
          color: '#6b7280',
          position: 0,
          recentActivity: true,
          leads: [
            {
              id: 'lead-1',
              title: 'Downtown Austin Investment',
              company: 'Johnson Properties',
              contact: 'Sarah Johnson',
              email: 'sarah.johnson@example.com',
              value: 850000,
              probability: 75,
              stage: 'stage-1',
              priority: 'high' as const,
              source: 'email',
              description: 'Interested in multi-unit downtown property for investment portfolio',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              automationEnabled: true,
              tags: ['investment', 'multi-unit'],
              threadId: 'thread-1',
              activities: [
                {
                  id: 'activity-1',
                  type: 'email' as const,
                  description: 'Initial inquiry about investment properties',
                  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                  linkedEmailId: 'email-1'
                }
              ]
            }
          ]
        },
        {
          id: 'stage-2',
          name: 'Qualified',
          color: '#3b82f6',
          position: 1,
          recentActivity: false,
          leads: [
            {
              id: 'lead-2',
              title: 'Commercial Office Space',
              company: 'Tech Corp',
              contact: 'Michael Chen',
              email: 'michael.chen@techcorp.com',
              value: 1200000,
              probability: 60,
              stage: 'stage-2',
              priority: 'medium' as const,
              source: 'referral',
              description: 'Looking for 10,000 sq ft office space in business district',
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              automationEnabled: false,
              tags: ['commercial', 'office'],
              threadId: 'thread-2',
              activities: [
                {
                  id: 'activity-2',
                  type: 'call' as const,
                  description: 'Phone consultation about requirements',
                  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                  linkedEmailId: null
                }
              ]
            }
          ]
        },
        {
          id: 'stage-3',
          name: 'Under Contract',
          color: '#f59e0b',
          position: 2,
          recentActivity: true,
          leads: [
            {
              id: 'lead-3',
              title: 'Family Home Purchase',
              company: 'Family Homes LLC',
              contact: 'Emma Rodriguez',
              email: 'emma@familyhomes.com',
              value: 450000,
              probability: 90,
              stage: 'stage-3',
              priority: 'high' as const,
              source: 'website',
              description: '4BR family home in suburban neighborhood',
              createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
              automationEnabled: true,
              tags: ['residential', 'family'],
              threadId: 'thread-3',
              activities: [
                {
                  id: 'activity-3',
                  type: 'meeting' as const,
                  description: 'Contract signing appointment',
                  createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                  linkedEmailId: null
                }
              ]
            }
          ]
        },
        {
          id: 'stage-4',
          name: 'Closed Won',
          color: '#10b981',
          position: 3,
          recentActivity: false,
          leads: [
            {
              id: 'lead-4',
              title: 'Luxury Condo Sale',
              company: 'Kim Realty Group',
              contact: 'David Kim',
              email: 'david.kim@kimrealty.com',
              value: 750000,
              probability: 100,
              stage: 'stage-4',
              priority: 'medium' as const,
              source: 'referral',
              description: 'High-end condo with city views',
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              automationEnabled: false,
              tags: ['luxury', 'condo'],
              threadId: 'thread-4',
              activities: [
                {
                  id: 'activity-4',
                  type: 'note' as const,
                  description: 'Transaction completed successfully',
                  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                  linkedEmailId: null
                }
              ]
            }
          ]
        },
        {
          id: 'stage-5',
          name: 'Closed Lost',
          color: '#ef4444',
          position: 4,
          recentActivity: false,
          leads: []
        }
      ];

      return NextResponse.json({
        stages: mockStages
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
