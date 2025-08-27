import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Get lead insights with filtering and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const category = url.searchParams.get('category'); // positive, negative, neutral, urgent
    const impact = url.searchParams.get('impact'); // high, medium, low
    const actionRequired = url.searchParams.get('actionRequired') === 'true';
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const leadId = url.searchParams.get('leadId');
    const contactId = url.searchParams.get('contactId');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const where: any = { orgId };

    if (category) where.category = category;
    if (impact) where.impact = impact;
    if (actionRequired) where.actionRequired = true;
    if (unreadOnly) where.isRead = false;

    // Filter by lead or contact through intelligence relationship
    if (leadId || contactId) {
      where.leadIntelligence = {
        ...(leadId && { leadId }),
        ...(contactId && { contactId })
      };
    }

    const insights = await prisma.leadInsight.findMany({
      where,
      include: {
        leadIntelligence: {
          include: {
            lead: true,
            contact: true
          }
        }
      },
      orderBy: [
        { actionRequired: 'desc' },
        { impact: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.leadInsight.count({ where });

    // Get summary stats
    const stats = await prisma.leadInsight.groupBy({
      by: ['category', 'impact', 'actionRequired'],
      where: { orgId },
      _count: true
    });

    const summary = {
      total: totalCount,
      unread: await prisma.leadInsight.count({ where: { orgId, isRead: false } }),
      actionRequired: await prisma.leadInsight.count({ where: { orgId, actionRequired: true, isRead: false } }),
      byCategory: {
        positive: stats.filter(s => s.category === 'positive').reduce((sum, s) => sum + s._count, 0),
        negative: stats.filter(s => s.category === 'negative').reduce((sum, s) => sum + s._count, 0),
        neutral: stats.filter(s => s.category === 'neutral').reduce((sum, s) => sum + s._count, 0),
        urgent: stats.filter(s => s.category === 'urgent').reduce((sum, s) => sum + s._count, 0)
      },
      byImpact: {
        high: stats.filter(s => s.impact === 'high').reduce((sum, s) => sum + s._count, 0),
        medium: stats.filter(s => s.impact === 'medium').reduce((sum, s) => sum + s._count, 0),
        low: stats.filter(s => s.impact === 'low').reduce((sum, s) => sum + s._count, 0)
      }
    };

    return NextResponse.json({
      insights,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary
    });

  } catch (error) {
    console.error('Failed to get insights:', error);
    return NextResponse.json(
      { error: 'Failed to get insights' },
      { status: 500 }
    );
  }
}

/**
 * Mark insights as read/dismissed
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { insightIds, action } = await req.json();

    if (!insightIds || !Array.isArray(insightIds)) {
      return NextResponse.json({ error: 'Insight IDs array required' }, { status: 400 });
    }

    if (!action || !['read', 'dismiss'].includes(action)) {
      return NextResponse.json({ error: 'Valid action required (read/dismiss)' }, { status: 400 });
    }

    const updateData: any = {};
    if (action === 'read') {
      updateData.isRead = true;
    } else if (action === 'dismiss') {
      updateData.isRead = true;
      updateData.dismissedAt = new Date();
    }

    const result = await prisma.leadInsight.updateMany({
      where: {
        id: { in: insightIds },
        orgId
      },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      updated: result.count
    });

  } catch (error) {
    console.error('Failed to update insights:', error);
    return NextResponse.json(
      { error: 'Failed to update insights' },
      { status: 500 }
    );
  }
}

/**
 * Create custom insight
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const {
      leadIntelligenceId,
      type,
      category,
      title,
      description,
      confidence = 0.5,
      impact = 'medium',
      actionRequired = false,
      suggestedActions = [],
      dataPoints = {}
    } = await req.json();

    if (!leadIntelligenceId || !type || !title || !description) {
      return NextResponse.json(
        { error: 'Lead intelligence ID, type, title, and description are required' },
        { status: 400 }
      );
    }

    // Verify the intelligence record exists and belongs to this org
    const intelligence = await prisma.leadIntelligence.findFirst({
      where: { id: leadIntelligenceId, orgId }
    });

    if (!intelligence) {
      return NextResponse.json(
        { error: 'Lead intelligence record not found' },
        { status: 404 }
      );
    }

    const insight = await prisma.leadInsight.create({
      data: {
        orgId,
        leadIntelligenceId,
        type,
        category: category || 'neutral',
        title,
        description,
        confidence,
        impact,
        actionRequired,
        suggestedActions,
        dataPoints
      }
    });

    return NextResponse.json({ insight });

  } catch (error) {
    console.error('Failed to create insight:', error);
    return NextResponse.json(
      { error: 'Failed to create insight' },
      { status: 500 }
    );
  }
}