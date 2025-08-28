import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { processAutoDraft } from '@/server/ai/auto-draft';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { emailId, threadId } = await request.json();

    if (!emailId) {
      return NextResponse.json({ error: 'emailId required' }, { status: 400 });
    }

    // Get the email's AI analysis
    const analysis = await prisma.emailAIAnalysis.findFirst({
      where: { emailId },
      orderBy: { createdAt: 'desc' }
    });

    if (!analysis) {
      return NextResponse.json({ error: 'No AI analysis found for this email' }, { status: 404 });
    }

    console.log(`🔧 Manual auto-draft trigger for email ${emailId}`);
    console.log(`📊 Analysis: ${analysis.category}, Priority: ${analysis.priorityScore}, Lead: ${analysis.leadScore}`);

    // Force auto-draft creation
    const result = await processAutoDraft(orgId, emailId, analysis);
    
    return NextResponse.json({
      success: true,
      drafted: result.drafted,
      draftId: result.draftId,
      notificationId: result.notificationId,
      analysis: {
        category: analysis.category,
        priorityScore: analysis.priorityScore,
        leadScore: analysis.leadScore,
        confidenceScore: analysis.confidenceScore
      },
      message: result.drafted ? 
        `Auto-draft created successfully for ${analysis.category}` : 
        `Auto-draft not created - scores too low or category not eligible`
    });

  } catch (error) {
    console.error('Manual auto-draft trigger error:', error);
    return NextResponse.json({
      error: 'Failed to trigger auto-draft',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}