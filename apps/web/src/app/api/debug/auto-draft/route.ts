import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { shouldAutoDraft } from '@/server/ai/auto-draft';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get recent AI analyses
    const recentAnalyses = await prisma.emailAIAnalysis.findMany({
      where: {
        email: { orgId },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      },
      include: {
        email: {
          include: {
            thread: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Check existing auto-drafts
    const existingDrafts = await prisma.aISuggestedReply.findMany({
      where: {
        status: 'draft',
        category: { endsWith: '-auto-draft' },
        email: { orgId },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Check which analyses should trigger auto-drafts
    const analysisDebug = recentAnalyses.map(analysis => {
      const shouldTrigger = shouldAutoDraft(analysis);
      return {
        emailId: analysis.emailId,
        category: analysis.category,
        priorityScore: analysis.priorityScore,
        leadScore: analysis.leadScore,
        shouldTrigger,
        hasExistingDraft: existingDrafts.some(d => d.emailId === analysis.emailId),
        createdAt: analysis.createdAt
      };
    });

    return NextResponse.json({
      recentAnalyses: analysisDebug,
      existingDrafts: existingDrafts.map(d => ({
        id: d.id,
        emailId: d.emailId,
        category: d.category,
        status: d.status,
        createdAt: d.createdAt
      })),
      autoDraftTriggers: {
        'showing_request': { minPriorityScore: 70, minLeadScore: 60 },
        'hot_lead': { minPriorityScore: 80, minLeadScore: 70 },
        'seller_lead': { minPriorityScore: 75, minLeadScore: 65 },
        'buyer_lead': { minPriorityScore: 75, minLeadScore: 65 },
        'price_inquiry': { minPriorityScore: 70, minLeadScore: 60 }
      }
    });

  } catch (error) {
    console.error('Auto-draft debug error:', error);
    return NextResponse.json({
      error: 'Failed to debug auto-draft system',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}