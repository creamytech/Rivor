import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST - Update thread actions (AI analysis override, add to pipeline, etc.)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ 
        error: 'No organization found' 
      }, { status: 400 });
    }

    const { threadId } = params;
    const body = await request.json();
    const { action, data } = body;

    logger.info('Thread action requested', {
      orgId,
      threadId,
      action,
      userEmail: session.user.email
    });

    switch (action) {
      case 'update_ai_analysis':
        return await updateAIAnalysis(orgId, threadId, data);
      
      case 'add_to_pipeline':
        return await addToPipeline(orgId, threadId, data);
      
      case 'update_category':
        return await updateCategory(orgId, threadId, data);
      
      case 'update_priority':
        return await updatePriority(orgId, threadId, data);
      
      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported actions: update_ai_analysis, add_to_pipeline, update_category, update_priority' 
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Thread action failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      error: 'Thread action failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Update AI analysis with user overrides
 */
async function updateAIAnalysis(orgId: string, threadId: string, data: any) {
  const { category, priority, leadScore, notes } = data;

  // Get the latest message in the thread
  const latestMessage = await prisma.emailMessage.findFirst({
    where: { 
      threadId,
      orgId 
    },
    orderBy: { sentAt: 'desc' },
    select: { id: true }
  });

  if (!latestMessage) {
    return NextResponse.json({ 
      error: 'No message found for thread' 
    }, { status: 404 });
  }

  // Check if AI analysis exists
  const existingAnalysis = await prisma.emailAIAnalysis.findUnique({
    where: { emailId: latestMessage.id }
  });

  if (existingAnalysis) {
    // Update existing analysis with user overrides
    const updatedAnalysis = await prisma.emailAIAnalysis.update({
      where: { emailId: latestMessage.id },
      data: {
        category: category || existingAnalysis.category,
        priorityScore: priority !== undefined ? priority : existingAnalysis.priorityScore,
        leadScore: leadScore !== undefined ? leadScore : existingAnalysis.leadScore,
        keyEntities: {
          ...existingAnalysis.keyEntities,
          userNotes: notes
        },
        processingStatus: 'user_modified'
      }
    });

    logger.info('AI analysis updated with user overrides', {
      orgId,
      threadId,
      emailId: latestMessage.id,
      changes: { category, priority, leadScore, notes }
    });

    return NextResponse.json({ 
      success: true,
      analysis: updatedAnalysis
    });
  } else {
    // Create new analysis based on user input
    const newAnalysis = await prisma.emailAIAnalysis.create({
      data: {
        emailId: latestMessage.id,
        threadId,
        category: category || 'follow_up',
        priorityScore: priority || 50,
        leadScore: leadScore || 50,
        confidenceScore: 0.5, // Lower confidence for manual entries
        sentimentScore: 0.5,
        keyEntities: {
          userNotes: notes,
          manualEntry: true
        },
        processingStatus: 'user_created'
      }
    });

    logger.info('AI analysis created from user input', {
      orgId,
      threadId,
      emailId: latestMessage.id,
      data: { category, priority, leadScore, notes }
    });

    return NextResponse.json({ 
      success: true,
      analysis: newAnalysis
    });
  }
}

/**
 * Add thread to sales pipeline
 */
async function addToPipeline(orgId: string, threadId: string, data: any) {
  const { 
    contactName, 
    contactEmail, 
    contactPhone,
    propertyAddress,
    propertyType,
    budget,
    timeline,
    notes,
    stage = 'new_lead'
  } = data;

  try {
    // First, check if a lead already exists for this thread
    const existingLead = await prisma.lead.findFirst({
      where: {
        orgId,
        OR: [
          { sourceId: threadId },
          { email: contactEmail }
        ]
      }
    });

    if (existingLead) {
      return NextResponse.json({
        error: 'Lead already exists for this contact',
        leadId: existingLead.id
      }, { status: 409 });
    }

    // Create a new lead from the email thread
    const newLead = await prisma.lead.create({
      data: {
        orgId,
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        source: 'email_manual',
        sourceId: threadId,
        stage: stage,
        status: 'active',
        notes: notes || '',
        metadata: {
          propertyAddress,
          propertyType,
          budget,
          timeline,
          createdFromThread: threadId,
          createdBy: 'user_action'
        }
      }
    });

    // Update the thread to link it to the new lead
    await prisma.emailThread.update({
      where: { id: threadId },
      data: { leadId: newLead.id }
    });

    // Create an activity log entry
    await prisma.activity.create({
      data: {
        orgId,
        leadId: newLead.id,
        type: 'lead_created',
        description: `Lead created from email thread: ${threadId}`,
        metadata: {
          threadId,
          source: 'email_manual'
        }
      }
    }).catch(() => {
      // Ignore if Activity table doesn't exist yet
      logger.warn('Could not create activity log - table may not exist');
    });

    logger.info('Lead created from email thread', {
      orgId,
      threadId,
      leadId: newLead.id,
      contactEmail
    });

    return NextResponse.json({
      success: true,
      lead: newLead,
      message: 'Successfully added to pipeline'
    });

  } catch (error) {
    logger.error('Failed to add thread to pipeline', {
      orgId,
      threadId,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      error: 'Failed to add to pipeline',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Update thread category
 */
async function updateCategory(orgId: string, threadId: string, data: any) {
  const { category } = data;

  // Get the latest message in the thread
  const latestMessage = await prisma.emailMessage.findFirst({
    where: { 
      threadId,
      orgId 
    },
    orderBy: { sentAt: 'desc' },
    select: { id: true }
  });

  if (!latestMessage) {
    return NextResponse.json({ 
      error: 'No message found for thread' 
    }, { status: 404 });
  }

  // Update or create AI analysis with new category
  const analysis = await prisma.emailAIAnalysis.upsert({
    where: { emailId: latestMessage.id },
    update: {
      category: category,
      processingStatus: 'user_modified'
    },
    create: {
      emailId: latestMessage.id,
      threadId,
      category: category,
      priorityScore: 50,
      leadScore: 50,
      confidenceScore: 0.5,
      sentimentScore: 0.5,
      keyEntities: {
        manualCategory: true
      },
      processingStatus: 'user_created'
    }
  });

  logger.info('Thread category updated', {
    orgId,
    threadId,
    category
  });

  return NextResponse.json({
    success: true,
    analysis
  });
}

/**
 * Update thread priority
 */
async function updatePriority(orgId: string, threadId: string, data: any) {
  const { priority } = data;

  // Convert priority levels to scores
  const priorityScores = {
    'low': 30,
    'medium': 65,
    'high': 90
  };

  const priorityScore = priorityScores[priority as keyof typeof priorityScores] || 50;

  // Get the latest message in the thread
  const latestMessage = await prisma.emailMessage.findFirst({
    where: { 
      threadId,
      orgId 
    },
    orderBy: { sentAt: 'desc' },
    select: { id: true }
  });

  if (!latestMessage) {
    return NextResponse.json({ 
      error: 'No message found for thread' 
    }, { status: 404 });
  }

  // Update or create AI analysis with new priority
  const analysis = await prisma.emailAIAnalysis.upsert({
    where: { emailId: latestMessage.id },
    update: {
      priorityScore: priorityScore,
      processingStatus: 'user_modified'
    },
    create: {
      emailId: latestMessage.id,
      threadId,
      category: 'follow_up',
      priorityScore: priorityScore,
      leadScore: 50,
      confidenceScore: 0.5,
      sentimentScore: 0.5,
      keyEntities: {
        manualPriority: true
      },
      processingStatus: 'user_created'
    }
  });

  logger.info('Thread priority updated', {
    orgId,
    threadId,
    priority,
    priorityScore
  });

  return NextResponse.json({
    success: true,
    analysis
  });
}