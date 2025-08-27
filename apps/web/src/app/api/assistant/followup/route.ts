import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { decryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';

/**
 * AI-Powered Follow-up Automation System
 * Replaces human assistant for follow-up sequences and nurturing
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
      action,
      contactId,
      leadId,
      emailThreadId,
      sequenceId,
      triggerEvent,
      customizations = {}
    } = await req.json();

    switch (action) {
      case 'create_sequence':
        return await createFollowUpSequence(req, orgId);
      case 'start_execution':
        return await startFollowUpExecution(orgId, {
          contactId,
          leadId,
          emailThreadId,
          sequenceId,
          customizations
        });
      case 'trigger_smart_followup':
        return await triggerSmartFollowUp(orgId, {
          contactId,
          leadId,
          emailThreadId,
          triggerEvent,
          customizations
        });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Failed to process follow-up action:', error);
    return NextResponse.json(
      { error: 'Failed to process follow-up action' },
      { status: 500 }
    );
  }
}

async function createFollowUpSequence(req: NextRequest, orgId: string) {
  const {
    name,
    description,
    sequenceType,
    triggerEvent,
    steps,
    conditions = {}
  } = await req.json();

  if (!name || !sequenceType || !steps || !Array.isArray(steps)) {
    return NextResponse.json({ 
      error: 'Name, sequence type, and steps array required' 
    }, { status: 400 });
  }

  // Validate steps format
  const validatedSteps = steps.map((step, index) => {
    if (!step.delay || !step.action || !step.content) {
      throw new Error(`Step ${index + 1} is missing required fields (delay, action, content)`);
    }
    
    return {
      stepNumber: index + 1,
      delay: step.delay, // e.g., "1 hour", "2 days", "1 week"
      delayInMinutes: parseDelayToMinutes(step.delay),
      action: step.action, // "send_email", "send_sms", "create_task", "schedule_call"
      content: step.content,
      subject: step.subject,
      conditions: step.conditions || {},
      aiPersonalization: step.aiPersonalization !== false // Default to true
    };
  });

  const session = await auth();
  const sequence = await prisma.followUpSequence.create({
    data: {
      orgId,
      name,
      description,
      sequenceType,
      triggerEvent,
      steps: validatedSteps,
      conditions,
      createdBy: session!.user!.id || session!.user!.email!
    }
  });

  return NextResponse.json({
    success: true,
    sequence: {
      id: sequence.id,
      name: sequence.name,
      sequenceType: sequence.sequenceType,
      stepsCount: validatedSteps.length,
      isActive: sequence.isActive
    }
  });
}

async function startFollowUpExecution(
  orgId: string,
  params: {
    contactId?: string;
    leadId?: string;
    emailThreadId?: string;
    sequenceId: string;
    customizations: any;
  }
) {
  const { contactId, leadId, emailThreadId, sequenceId, customizations } = params;

  // Verify the sequence exists and is active
  const sequence = await prisma.followUpSequence.findFirst({
    where: { id: sequenceId, orgId, isActive: true }
  });

  if (!sequence) {
    return NextResponse.json({ error: 'Sequence not found or inactive' }, { status: 404 });
  }

  // Check if there's already an active execution for this contact/lead
  const existingExecution = await prisma.followUpExecution.findFirst({
    where: {
      orgId,
      sequenceId,
      status: 'active',
      ...(contactId && { contactId }),
      ...(leadId && { leadId })
    }
  });

  if (existingExecution) {
    return NextResponse.json({ 
      error: 'Follow-up sequence already active for this contact/lead',
      executionId: existingExecution.id
    }, { status: 409 });
  }

  // Calculate first step timing
  const steps = sequence.steps as any[];
  const firstStepDelay = steps[0]?.delayInMinutes || 0;
  const nextActionAt = new Date(Date.now() + firstStepDelay * 60 * 1000);

  const execution = await prisma.followUpExecution.create({
    data: {
      orgId,
      sequenceId,
      contactId,
      leadId,
      emailThreadId,
      nextActionAt,
      customizations,
      completedSteps: []
    }
  });

  // Generate AI-personalized content for the sequence
  await generatePersonalizedContent(execution, sequence, customizations);

  return NextResponse.json({
    success: true,
    execution: {
      id: execution.id,
      sequenceName: sequence.name,
      nextActionAt: execution.nextActionAt?.toISOString(),
      totalSteps: steps.length
    }
  });
}

async function triggerSmartFollowUp(
  orgId: string,
  params: {
    contactId?: string;
    leadId?: string;
    emailThreadId?: string;
    triggerEvent: string;
    customizations: any;
  }
) {
  const { contactId, leadId, emailThreadId, triggerEvent, customizations } = params;

  // Find the best matching sequence based on trigger event and conditions
  const matchingSequences = await prisma.followUpSequence.findMany({
    where: {
      orgId,
      isActive: true,
      triggerEvent
    }
  });

  if (matchingSequences.length === 0) {
    // Create a default smart follow-up based on the trigger event
    return await createSmartDefaultFollowUp(orgId, params);
  }

  // Select the best sequence based on conditions
  let bestSequence = matchingSequences[0];
  
  for (const sequence of matchingSequences) {
    const conditions = sequence.conditions as any;
    if (await evaluateSequenceConditions(conditions, { contactId, leadId, emailThreadId, orgId })) {
      bestSequence = sequence;
      break;
    }
  }

  // Start execution with the best matching sequence
  return await startFollowUpExecution(orgId, {
    contactId,
    leadId,
    emailThreadId,
    sequenceId: bestSequence.id,
    customizations
  });
}

async function createSmartDefaultFollowUp(
  orgId: string,
  params: {
    contactId?: string;
    leadId?: string;
    emailThreadId?: string;
    triggerEvent: string;
    customizations: any;
  }
) {
  const { triggerEvent } = params;

  // Define default sequences based on trigger events
  const defaultSequences: Record<string, any> = {
    'email_received': {
      name: 'Smart Email Follow-up',
      steps: [
        {
          delay: '2 hours',
          action: 'send_email',
          subject: 'Thank you for reaching out!',
          content: 'Thanks for your email. I\'ll review your inquiry and get back to you with a detailed response shortly.'
        },
        {
          delay: '1 day',
          action: 'send_email', 
          subject: 'Following up on your inquiry',
          content: 'I wanted to follow up on your previous email. Do you have any questions I can help answer?'
        }
      ]
    },
    'appointment_completed': {
      name: 'Post-Appointment Follow-up',
      steps: [
        {
          delay: '1 hour',
          action: 'send_email',
          subject: 'Thank you for meeting with me today',
          content: 'It was great meeting with you today! I\'ve attached some additional information we discussed.'
        },
        {
          delay: '2 days',
          action: 'create_task',
          content: 'Check in with client about next steps after appointment'
        }
      ]
    },
    'lead_created': {
      name: 'New Lead Nurturing',
      steps: [
        {
          delay: '15 minutes',
          action: 'send_email',
          subject: 'Welcome! Let\'s find your perfect property',
          content: 'Welcome to our real estate family! I\'m excited to help you find the perfect property.'
        },
        {
          delay: '3 days',
          action: 'send_email',
          subject: 'Market insights for your area',
          content: 'I\'ve prepared some market insights that might interest you based on your preferences.'
        }
      ]
    }
  };

  const sequenceTemplate = defaultSequences[triggerEvent];
  if (!sequenceTemplate) {
    return NextResponse.json({ 
      error: 'No default sequence available for this trigger event' 
    }, { status: 404 });
  }

  // Create the sequence on-the-fly
  const session = await auth();
  const sequence = await prisma.followUpSequence.create({
    data: {
      orgId,
      name: `${sequenceTemplate.name} (Auto-generated)`,
      description: `Automatically generated sequence for ${triggerEvent}`,
      sequenceType: 'smart_generated',
      triggerEvent,
      steps: sequenceTemplate.steps.map((step: any, index: number) => ({
        ...step,
        stepNumber: index + 1,
        delayInMinutes: parseDelayToMinutes(step.delay),
        aiPersonalization: true
      })),
      createdBy: 'ai_system'
    }
  });

  // Start execution immediately
  return await startFollowUpExecution(orgId, {
    ...params,
    sequenceId: sequence.id
  });
}

async function generatePersonalizedContent(
  execution: any,
  sequence: any,
  customizations: any
) {
  try {
    // Get agent personality for personalized content generation
    const personality = await prisma.agentPersonality.findUnique({
      where: { orgId: execution.orgId }
    });

    // Get context about the contact/lead
    let context: any = {
      reason: 'follow_up_sequence',
      urgency: sequence.urgency || 'medium'
    };
    let recipient: any = {};
    
    if (execution.contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: execution.contactId }
      });
      
      if (contact) {
        let contactName = 'Valued Client';
        if (contact.nameEnc) {
          try {
            const nameBytes = await decryptForOrg(execution.orgId, contact.nameEnc, 'contact:name');
            contactName = new TextDecoder().decode(nameBytes);
          } catch (error) {
            console.warn('Failed to decrypt contact name for personalization');
          }
        }
        recipient.name = contactName;
        context.contactInfo = `Contact Name: ${contactName}`;
      }
    }

    if (execution.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: execution.leadId }
      });
      
      if (lead) {
        context.property = lead.title;
        context.stage = lead.stage;
        context.value = lead.propertyValue;
        recipient.leadInfo = `Lead: ${lead.title} (${lead.stage})`;
      }
    }

    // Generate personalized versions of sequence steps using agent personality
    const steps = sequence.steps as any[];
    const personalizedSteps = await Promise.all(steps.map(async step => {
      if (step.aiPersonalization && personality?.onboardingCompleted) {
        try {
          // Use the personality-based content generation
          const personalizedContent = await generatePersonalizedFollowUp({
            type: 'follow_up_email',
            context: { 
              ...context,
              stepNumber: step.order,
              originalContent: step.content,
              customizations
            },
            recipient,
            personality
          });
          
          // Save the generated content
          await prisma.aIGeneratedContent.create({
            data: {
              orgId: execution.orgId,
              contentType: 'follow_up_email',
              generatedContent: personalizedContent,
              context: JSON.stringify({ 
                sequenceId: sequence.id, 
                stepId: step.id,
                executionId: execution.id 
              }),
              personalityVersion: personality.updatedAt.toISOString(),
              isApproved: false
            }
          });
          
          return {
            ...step,
            originalContent: step.content,
            personalizedContent
          };
        } catch (error) {
          console.error('Error generating personalized content for step:', error);
          // Fallback to basic personalization
          return {
            ...step,
            originalContent: step.content,
            personalizedContent: personalizeContent(step.content, context, customizations)
          };
        }
      }
      return step;
    }));

    // Update the execution with personalized content
    await prisma.followUpExecution.update({
      where: { id: execution.id },
      data: {
        customizations: {
          ...customizations,
          personalizedSteps,
          generatedAt: new Date().toISOString(),
          personalityUsed: personality ? true : false
        }
      }
    });

  } catch (error) {
    console.error('Error generating personalized content:', error);
  }
}

async function generatePersonalizedFollowUp({ type, context, recipient, personality }: any) {
  const style = personality.communicationStyle || 'professional';
  const tonePrefs = personality.tonePreferences || {};
  const vocab = personality.vocabularyPreferences || [];
  const patterns = personality.writingPatterns || {};
  const responses = personality.responseStyle || {};

  // Use the same generation logic from the personality API
  return generateFollowUpEmail(context, recipient, style, tonePrefs, vocab, patterns);
}

function generateFollowUpEmail(context: any, recipient: any, style: string, tonePrefs: any, vocab: string[], patterns: any) {
  const warmth = tonePrefs?.warmth || 1;
  const urgency = context?.urgency || 'medium';
  
  let subject = '';
  let body = '';

  // Generate subject line based on context
  if (context.stepNumber === 1) {
    subject = style === 'casual' ? 
      `Following up on ${context?.property || 'your inquiry'} 🏠` :
      `Following up on your ${context?.property || 'property interest'}`;
  } else {
    subject = `Checking in - ${context?.property || 'your search'}`;
  }

  // Generate body based on style and warmth
  if (warmth > 2) {
    body = `Hi ${recipient?.name || 'there'}!\n\nI hope you're having a wonderful day! `;
  } else {
    body = `Hello ${recipient?.name || 'there'},\n\n`;
  }

  // Add main message based on step number
  if (context.stepNumber === 1) {
    body += `I wanted to follow up on ${context?.property || 'the property you were interested in'}. `;
    if (style === 'friendly') {
      body += `I'm excited to help you with your real estate journey! `;
    } else {
      body += `I'm available to answer any questions you might have. `;
    }
  } else {
    body += `I hope you're still interested in ${context?.property || 'finding the perfect property'}. `;
    if (urgency === 'high') {
      body += `The market has been quite active lately, and I wanted to make sure you don't miss out on great opportunities. `;
    }
  }

  // Add any original content if provided
  if (context.originalContent) {
    body += `\n\n${context.originalContent}`;
  }

  // Add signature based on patterns
  if (patterns?.usesExclamation && style !== 'professional') {
    body += `\n\nLooking forward to hearing from you!`;
  } else {
    body += `\n\nI look forward to your response.`;
  }

  return { subject, body };
}

function personalizeContent(content: string, context: any, customizations: any): string {
  let personalized = content;
  
  // Basic personalization - would be enhanced with AI in production
  if (context.contactInfo?.includes('Contact Name:')) {
    const name = context.contactInfo.match(/Contact Name: (.+)/)?.[1];
    if (name && name !== 'Valued Client') {
      personalized = personalized.replace(/\b(Hi|Hello|Dear),?\s*/gi, `Hi ${name.split(' ')[0]}, `);
    }
  }

  // Apply custom variables
  Object.entries(customizations).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    personalized = personalized.replace(placeholder, String(value));
  });

  return personalized;
}

async function evaluateSequenceConditions(
  conditions: any,
  context: { contactId?: string; leadId?: string; emailThreadId?: string; orgId: string }
): Promise<boolean> {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true; // No conditions means it matches
  }

  // Evaluate conditions like lead stage, contact tags, time of day, etc.
  try {
    if (conditions.leadStage && context.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: context.leadId, orgId: context.orgId }
      });
      
      if (lead?.stage !== conditions.leadStage) {
        return false;
      }
    }

    if (conditions.contactTags && context.contactId) {
      // Would check contact tags if implemented
    }

    if (conditions.timeOfDay) {
      const currentHour = new Date().getHours();
      const { start, end } = conditions.timeOfDay;
      if (currentHour < start || currentHour > end) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error evaluating sequence conditions:', error);
    return true; // Default to true on error
  }
}

function parseDelayToMinutes(delay: string): number {
  const match = delay.match(/(\d+)\s*(minute|hour|day|week)s?/i);
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'minute': return value;
    case 'hour': return value * 60;
    case 'day': return value * 24 * 60;
    case 'week': return value * 7 * 24 * 60;
    default: return 0;
  }
}

/**
 * Get follow-up sequences and executions
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
    const type = url.searchParams.get('type'); // 'sequences' or 'executions'
    const status = url.searchParams.get('status');
    const contactId = url.searchParams.get('contactId');

    if (type === 'sequences') {
      const sequences = await prisma.followUpSequence.findMany({
        where: { orgId },
        include: {
          _count: {
            select: { executions: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        sequences: sequences.map(seq => ({
          ...seq,
          steps: Array.isArray(seq.steps) ? seq.steps.length : 0,
          executionCount: seq._count.executions
        }))
      });
    }

    // Get executions
    const where: any = { orgId };
    if (status) where.status = status;
    if (contactId) where.contactId = contactId;

    const executions = await prisma.followUpExecution.findMany({
      where,
      include: {
        sequence: {
          select: { name: true, sequenceType: true }
        },
        contact: {
          select: { id: true, nameEnc: true }
        },
        lead: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      executions: executions.map(exec => ({
        ...exec,
        nextActionAt: exec.nextActionAt?.toISOString(),
        completedAt: exec.completedAt?.toISOString(),
        pausedAt: exec.pausedAt?.toISOString()
      })),
      summary: {
        active: executions.filter(e => e.status === 'active').length,
        completed: executions.filter(e => e.status === 'completed').length,
        paused: executions.filter(e => e.status === 'paused').length
      }
    });

  } catch (error) {
    console.error('Failed to get follow-up data:', error);
    return NextResponse.json(
      { error: 'Failed to get follow-up data' },
      { status: 500 }
    );
  }
}