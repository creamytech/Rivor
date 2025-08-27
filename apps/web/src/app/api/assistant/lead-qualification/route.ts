import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { encryptForOrg, decryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';

/**
 * AI-Powered Lead Qualification and Nurturing System
 * Automatically qualifies leads and triggers appropriate nurturing sequences
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
      responses,
      source
    } = await req.json();

    switch (action) {
      case 'qualify_lead':
        return await qualifyLead(orgId, { contactId, leadId, emailThreadId, responses, source });
      case 'auto_qualify_from_email':
        return await autoQualifyFromEmail(orgId, emailThreadId);
      case 'bulk_qualify':
        return await bulkQualifyLeads(orgId, req);
      case 'get_qualification_form':
        return await getQualificationForm(orgId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Failed to process lead qualification:', error);
    return NextResponse.json(
      { error: 'Failed to process lead qualification' },
      { status: 500 }
    );
  }
}

async function qualifyLead(
  orgId: string,
  params: {
    contactId?: string;
    leadId?: string;
    emailThreadId?: string;
    responses: Record<string, any>;
    source: string;
  }
) {
  const { contactId, leadId, emailThreadId, responses, source } = params;

  // Calculate qualification score based on responses
  const qualificationResult = await calculateQualificationScore(responses);
  
  let lead = null;
  let contact = null;

  // Get or create lead record
  if (leadId) {
    lead = await prisma.lead.findFirst({
      where: { id: leadId, orgId },
      include: { contact: true }
    });
    contact = lead?.contact;
  } else if (contactId) {
    contact = await prisma.contact.findFirst({
      where: { id: contactId, orgId }
    });
    
    // Create lead if high qualification score
    if (qualificationResult.score >= 60) {
      lead = await createLeadFromQualification(orgId, contact, qualificationResult, responses);
    }
  }

  // Update contact with qualification data
  if (contact) {
    await updateContactWithQualificationData(contact, qualificationResult, responses);
  }

  // Update lead with qualification data
  if (lead) {
    await updateLeadWithQualificationData(lead, qualificationResult, responses);
  }

  // Trigger appropriate nurturing sequence based on qualification
  const nurturingSequence = await triggerNurturingSequence(
    orgId,
    qualificationResult,
    contactId,
    leadId,
    emailThreadId
  );

  // Create intelligent follow-up tasks
  const followUpTasks = await createIntelligentFollowUpTasks(
    orgId,
    qualificationResult,
    contact,
    lead
  );

  // Generate AI recommendations
  const recommendations = generateQualificationRecommendations(
    qualificationResult,
    responses
  );

  return NextResponse.json({
    success: true,
    qualification: {
      score: qualificationResult.score,
      tier: qualificationResult.tier,
      confidence: qualificationResult.confidence,
      keyFactors: qualificationResult.keyFactors,
      redFlags: qualificationResult.redFlags
    },
    actions: {
      nurturingSequence: nurturingSequence?.id,
      followUpTasks: followUpTasks.map(t => t.id),
      leadCreated: lead?.id,
      recommendations
    },
    nextSteps: generateNextSteps(qualificationResult, responses)
  });
}

async function autoQualifyFromEmail(orgId: string, emailThreadId: string) {
  try {
    // Get email thread with AI analysis
    const thread = await prisma.emailThread.findFirst({
      where: { id: emailThreadId, orgId },
      include: { aiAnalysis: true }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Email thread not found' }, { status: 404 });
    }

    // Extract qualification signals from AI analysis and email content
    const qualificationSignals = await extractQualificationSignals(thread);
    
    // Find or create contact from email participants
    const contact = await findOrCreateContactFromEmail(orgId, thread);
    
    // Run qualification
    return await qualifyLead(orgId, {
      contactId: contact.id,
      emailThreadId,
      responses: qualificationSignals,
      source: 'email_auto_qualification'
    });

  } catch (error) {
    console.error('Error in auto-qualification from email:', error);
    return NextResponse.json(
      { error: 'Failed to auto-qualify from email' },
      { status: 500 }
    );
  }
}

async function calculateQualificationScore(responses: Record<string, any>) {
  let score = 0;
  let confidence = 0;
  const keyFactors = [];
  const redFlags = [];

  // Budget qualification (30 points max)
  if (responses.budget) {
    const budget = parseInt(responses.budget);
    if (budget >= 1000000) {
      score += 30;
      keyFactors.push('High budget ($1M+)');
    } else if (budget >= 500000) {
      score += 25;
      keyFactors.push('Strong budget ($500K+)');
    } else if (budget >= 250000) {
      score += 20;
      keyFactors.push('Moderate budget ($250K+)');
    } else if (budget < 100000) {
      score += 5;
      redFlags.push('Low budget (<$100K)');
    }
    confidence += 25;
  }

  // Timeline qualification (25 points max)
  if (responses.timeline) {
    const timeline = responses.timeline.toLowerCase();
    if (timeline.includes('immediate') || timeline.includes('asap') || timeline.includes('1 month')) {
      score += 25;
      keyFactors.push('Immediate timeline');
    } else if (timeline.includes('3 month') || timeline.includes('soon')) {
      score += 20;
      keyFactors.push('Near-term timeline (3 months)');
    } else if (timeline.includes('6 month')) {
      score += 15;
      keyFactors.push('Medium-term timeline (6 months)');
    } else if (timeline.includes('year') || timeline.includes('someday')) {
      score += 5;
      redFlags.push('Long-term/vague timeline');
    }
    confidence += 20;
  }

  // Decision-making authority (20 points max)
  if (responses.decisionMaker) {
    const decisionMaker = responses.decisionMaker.toLowerCase();
    if (decisionMaker.includes('yes') || decisionMaker.includes('sole') || decisionMaker.includes('primary')) {
      score += 20;
      keyFactors.push('Primary decision maker');
    } else if (decisionMaker.includes('spouse') || decisionMaker.includes('partner')) {
      score += 15;
      keyFactors.push('Joint decision making');
    } else if (decisionMaker.includes('no') || decisionMaker.includes('committee') || decisionMaker.includes('boss')) {
      score += 5;
      redFlags.push('Not the decision maker');
    }
    confidence += 20;
  }

  // Urgency/motivation (15 points max)
  if (responses.motivation || responses.urgency) {
    const motivation = (responses.motivation + ' ' + responses.urgency).toLowerCase();
    if (motivation.includes('must sell') || motivation.includes('job relocation') || motivation.includes('divorce')) {
      score += 15;
      keyFactors.push('High motivation/urgency');
    } else if (motivation.includes('upgrade') || motivation.includes('growing family')) {
      score += 12;
      keyFactors.push('Good motivation');
    } else if (motivation.includes('just looking') || motivation.includes('curious')) {
      score += 3;
      redFlags.push('Low motivation - browsing');
    }
    confidence += 15;
  }

  // Pre-approval/financing (10 points max)
  if (responses.preApproved) {
    const preApproved = responses.preApproved.toLowerCase();
    if (preApproved.includes('yes') || preApproved.includes('approved') || preApproved.includes('cash')) {
      score += 10;
      keyFactors.push('Pre-approved for financing');
    } else if (preApproved.includes('no') || preApproved.includes('need to')) {
      score += 2;
      redFlags.push('Not pre-approved');
    }
    confidence += 10;
  }

  // Location specificity (extra 5 points)
  if (responses.location && responses.location.length > 10) {
    score += 5;
    keyFactors.push('Specific location requirements');
    confidence += 5;
  }

  // Property type clarity (extra 5 points)
  if (responses.propertyType && responses.propertyType !== 'not sure') {
    score += 5;
    keyFactors.push('Clear property preferences');
    confidence += 5;
  }

  // Determine tier based on score
  let tier = 'D'; // Cold lead
  if (score >= 80) tier = 'A'; // Hot lead - immediate attention
  else if (score >= 65) tier = 'B'; // Warm lead - regular follow-up
  else if (score >= 45) tier = 'C'; // Cold lead - nurture sequence

  return {
    score: Math.min(score, 100),
    tier,
    confidence: Math.min(confidence, 100),
    keyFactors,
    redFlags
  };
}

async function createLeadFromQualification(
  orgId: string,
  contact: any,
  qualification: any,
  responses: any
) {
  try {
    const leadData: any = {
      orgId,
      contactId: contact.id,
      title: `${contact.nameEnc ? '[Encrypted Name]' : 'New Lead'} - ${responses.propertyType || 'Property'} Search`,
      source: 'qualification_system',
      probabilityPercent: Math.min(qualification.score, 95), // Cap at 95%
      stage: getInitialStageBasedOnTier(qualification.tier),
      propertyValue: responses.budget ? parseInt(responses.budget) : null,
      notes: generateLeadNotes(qualification, responses)
    };

    // Set expected close date based on timeline
    if (responses.timeline) {
      leadData.expectedCloseDate = calculateExpectedCloseDate(responses.timeline);
    }

    const lead = await prisma.lead.create({ data: leadData });

    // Create initial task for lead follow-up
    await prisma.task.create({
      data: {
        orgId,
        linkLeadId: lead.id,
        linkedContactId: contact.id,
        title: `Follow up with ${qualification.tier}-tier qualified lead`,
        description: `Lead qualification score: ${qualification.score}. Key factors: ${qualification.keyFactors.join(', ')}`,
        priority: qualification.tier === 'A' ? 'high' : qualification.tier === 'B' ? 'medium' : 'low',
        status: 'pending',
        dueAt: new Date(Date.now() + (qualification.tier === 'A' ? 2 : qualification.tier === 'B' ? 24 : 72) * 60 * 60 * 1000),
        createdBy: 'ai_system'
      }
    });

    return lead;
  } catch (error) {
    console.error('Error creating lead from qualification:', error);
    return null;
  }
}

async function updateContactWithQualificationData(
  contact: any,
  qualification: any,
  responses: any
) {
  try {
    const updateData: any = {
      status: qualification.tier === 'A' ? 'lead' : qualification.tier === 'B' ? 'prospect' : contact.status,
      lastActivity: new Date(),
      tags: [
        ...contact.tags || [],
        `qualified_${qualification.tier.toLowerCase()}`,
        `score_${qualification.score}`
      ]
    };

    await prisma.contact.update({
      where: { id: contact.id },
      data: updateData
    });
  } catch (error) {
    console.error('Error updating contact with qualification data:', error);
  }
}

async function updateLeadWithQualificationData(
  lead: any,
  qualification: any,
  responses: any
) {
  try {
    const updateData: any = {
      probabilityPercent: qualification.score,
      tags: [
        ...lead.tags || [],
        `ai_qualified`,
        `tier_${qualification.tier.toLowerCase()}`,
        `confidence_${qualification.confidence}`
      ]
    };

    if (responses.budget) {
      updateData.propertyValue = parseInt(responses.budget);
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: updateData
    });
  } catch (error) {
    console.error('Error updating lead with qualification data:', error);
  }
}

async function triggerNurturingSequence(
  orgId: string,
  qualification: any,
  contactId?: string,
  leadId?: string,
  emailThreadId?: string
) {
  try {
    // Determine sequence type based on qualification tier
    let sequenceType = '';
    let triggerEvent = '';

    if (qualification.tier === 'A') {
      sequenceType = 'hot_lead_sequence';
      triggerEvent = 'hot_lead_qualified';
    } else if (qualification.tier === 'B') {
      sequenceType = 'warm_lead_sequence';
      triggerEvent = 'warm_lead_qualified';
    } else {
      sequenceType = 'nurture_sequence';
      triggerEvent = 'cold_lead_qualified';
    }

    // Look for existing sequence
    let sequence = await prisma.followUpSequence.findFirst({
      where: { orgId, sequenceType, isActive: true }
    });

    // Create default sequence if none exists
    if (!sequence) {
      sequence = await createDefaultNurturingSequence(orgId, sequenceType, qualification.tier);
    }

    // Start execution
    const execution = await prisma.followUpExecution.create({
      data: {
        orgId,
        sequenceId: sequence.id,
        contactId,
        leadId,
        emailThreadId,
        nextActionAt: new Date(Date.now() + 30 * 60 * 1000), // Start in 30 minutes
        customizations: {
          qualificationScore: qualification.score,
          qualificationTier: qualification.tier,
          keyFactors: qualification.keyFactors
        }
      }
    });

    return execution;
  } catch (error) {
    console.error('Error triggering nurturing sequence:', error);
    return null;
  }
}

async function createDefaultNurturingSequence(orgId: string, sequenceType: string, tier: string) {
  const sequences = {
    'hot_lead_sequence': {
      name: 'Hot Lead Follow-up (A-Tier)',
      steps: [
        {
          stepNumber: 1,
          delay: '30 minutes',
          delayInMinutes: 30,
          action: 'send_email',
          subject: 'Thank you for your interest - Let\'s schedule a call',
          content: 'Thank you for providing your information! Based on your requirements, I have some excellent properties that would be perfect for you. When would be a good time for a quick call to discuss your needs?'
        },
        {
          stepNumber: 2,
          delay: '2 hours',
          delayInMinutes: 120,
          action: 'create_task',
          content: 'Call hot lead - follow up on property requirements'
        },
        {
          stepNumber: 3,
          delay: '1 day',
          delayInMinutes: 1440,
          action: 'send_email',
          subject: 'Properties matching your criteria',
          content: 'I\'ve found several properties that match your criteria and budget. I\'d love to show you these exclusive listings. Are you available this week for a viewing?'
        }
      ]
    },
    'warm_lead_sequence': {
      name: 'Warm Lead Nurturing (B-Tier)',
      steps: [
        {
          stepNumber: 1,
          delay: '2 hours',
          delayInMinutes: 120,
          action: 'send_email',
          subject: 'Welcome! Your property search starts here',
          content: 'Welcome to our real estate family! I\'m excited to help you find the perfect property. I\'ll be sending you market updates and properties that match your preferences.'
        },
        {
          stepNumber: 2,
          delay: '3 days',
          delayInMinutes: 4320,
          action: 'send_email',
          subject: 'Market insights for your area',
          content: 'Here are some market insights for your target area. The market is moving, and I wanted to keep you informed about recent trends and pricing.'
        },
        {
          stepNumber: 3,
          delay: '1 week',
          delayInMinutes: 10080,
          action: 'send_email',
          subject: 'New listings in your price range',
          content: 'I have some new listings that came on the market this week that might interest you. Would you like to schedule a viewing?'
        }
      ]
    },
    'nurture_sequence': {
      name: 'Long-term Nurturing (C/D-Tier)',
      steps: [
        {
          stepNumber: 1,
          delay: '1 day',
          delayInMinutes: 1440,
          action: 'send_email',
          subject: 'Thank you for your interest',
          content: 'Thank you for reaching out! While you\'re in the early stages of your property search, I\'ll keep you informed about market trends and opportunities.'
        },
        {
          stepNumber: 2,
          delay: '1 week',
          delayInMinutes: 10080,
          action: 'send_email',
          subject: 'Weekly market update',
          content: 'Here\'s your weekly market update with the latest trends, new listings, and price changes in your area of interest.'
        },
        {
          stepNumber: 3,
          delay: '2 weeks',
          delayInMinutes: 20160,
          action: 'send_email',
          subject: 'Ready to take the next step?',
          content: 'It\'s been a couple weeks since we last connected. Are you ready to take the next step in your property search? I\'d love to help when the time is right.'
        }
      ]
    }
  };

  const sequenceData = sequences[sequenceType as keyof typeof sequences];
  
  return await prisma.followUpSequence.create({
    data: {
      orgId,
      name: sequenceData.name,
      description: `Auto-generated ${tier}-tier nurturing sequence`,
      sequenceType,
      triggerEvent: `${tier}_tier_qualified`,
      steps: sequenceData.steps,
      isActive: true,
      createdBy: 'ai_system'
    }
  });
}

async function createIntelligentFollowUpTasks(
  orgId: string,
  qualification: any,
  contact: any,
  lead: any
) {
  const tasks = [];

  if (qualification.tier === 'A') {
    // Hot leads get immediate tasks
    tasks.push({
      title: 'URGENT: Call hot lead within 2 hours',
      description: `Hot lead qualification score: ${qualification.score}. Key factors: ${qualification.keyFactors.join(', ')}`,
      priority: 'high',
      dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
    });

    tasks.push({
      title: 'Prepare property recommendations',
      description: `Research and prepare 3-5 property recommendations matching lead criteria`,
      priority: 'high',
      dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
    });
  } else if (qualification.tier === 'B') {
    // Warm leads get follow-up within 24 hours
    tasks.push({
      title: 'Follow up with warm lead',
      description: `Warm lead qualification score: ${qualification.score}. Schedule call or send personalized email.`,
      priority: 'medium',
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
  } else {
    // Cold leads get nurturing task
    tasks.push({
      title: 'Add to long-term nurturing campaign',
      description: `Cold lead - add to automated nurturing sequence and review in 2 weeks`,
      priority: 'low',
      dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
    });
  }

  const createdTasks = [];
  for (const taskData of tasks) {
    const task = await prisma.task.create({
      data: {
        orgId,
        ...taskData,
        linkedContactId: contact?.id,
        linkLeadId: lead?.id,
        status: 'pending',
        createdBy: 'ai_system'
      }
    });
    createdTasks.push(task);
  }

  return createdTasks;
}

function generateQualificationRecommendations(qualification: any, responses: any) {
  const recommendations = [];

  if (qualification.tier === 'A') {
    recommendations.push('🔥 Hot lead! Contact immediately - high conversion probability');
    recommendations.push('📞 Schedule phone call within 2 hours for best results');
    if (responses.timeline && responses.timeline.includes('immediate')) {
      recommendations.push('⚡ Immediate timeline - prepare showing appointments');
    }
  } else if (qualification.tier === 'B') {
    recommendations.push('🌡️ Warm lead - follow up within 24 hours');
    recommendations.push('📧 Send personalized property recommendations');
  } else {
    recommendations.push('❄️ Cold lead - add to nurturing sequence');
    recommendations.push('📊 Focus on education and market updates');
  }

  if (qualification.redFlags.length > 0) {
    recommendations.push(`⚠️ Address concerns: ${qualification.redFlags.join(', ')}`);
  }

  if (!responses.preApproved) {
    recommendations.push('💳 Discuss pre-approval process to improve qualification');
  }

  return recommendations;
}

function generateNextSteps(qualification: any, responses: any) {
  const nextSteps = [];

  if (qualification.tier === 'A') {
    nextSteps.push('1. Call lead within 2 hours');
    nextSteps.push('2. Schedule property viewing');
    nextSteps.push('3. Prepare customized property presentation');
  } else if (qualification.tier === 'B') {
    nextSteps.push('1. Send personalized follow-up email within 24 hours');
    nextSteps.push('2. Provide market insights and property recommendations');
    nextSteps.push('3. Schedule follow-up call within 1 week');
  } else {
    nextSteps.push('1. Add to automated nurturing sequence');
    nextSteps.push('2. Send educational content about the buying process');
    nextSteps.push('3. Re-qualify in 30-60 days');
  }

  return nextSteps;
}

function getInitialStageBasedOnTier(tier: string) {
  switch (tier) {
    case 'A': return 'qualified';
    case 'B': return 'interested';
    case 'C': return 'awareness';
    default: return 'unqualified';
  }
}

function calculateExpectedCloseDate(timeline: string): Date {
  const now = new Date();
  const timelineLower = timeline.toLowerCase();

  if (timelineLower.includes('immediate') || timelineLower.includes('asap')) {
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  } else if (timelineLower.includes('1 month') || timelineLower.includes('month')) {
    return new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days
  } else if (timelineLower.includes('3 month')) {
    return new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000); // 120 days
  } else if (timelineLower.includes('6 month')) {
    return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days
  } else {
    return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 days
  }
}

function generateLeadNotes(qualification: any, responses: any): string {
  const notes = [
    `🤖 AI Qualification Score: ${qualification.score}/100 (${qualification.tier}-tier)`,
    `✅ Key Factors: ${qualification.keyFactors.join(', ')}`,
    qualification.redFlags.length > 0 ? `⚠️ Red Flags: ${qualification.redFlags.join(', ')}` : null,
    responses.budget ? `💰 Budget: $${parseInt(responses.budget).toLocaleString()}` : null,
    responses.timeline ? `⏰ Timeline: ${responses.timeline}` : null,
    responses.location ? `📍 Location: ${responses.location}` : null,
    responses.propertyType ? `🏠 Property Type: ${responses.propertyType}` : null,
    `🎯 Confidence Level: ${qualification.confidence}%`
  ].filter(Boolean);

  return notes.join('\n');
}

async function extractQualificationSignals(thread: any) {
  const signals: Record<string, any> = {};

  // Extract signals from AI analysis
  if (thread.aiAnalysis) {
    const analysis = thread.aiAnalysis;
    
    // Budget signals
    if (analysis.keyEntities?.priceRange || analysis.keyEntities?.budget) {
      signals.budget = analysis.keyEntities.priceRange || analysis.keyEntities.budget;
    }

    // Timeline signals
    if (analysis.keyEntities?.urgency) {
      if (analysis.keyEntities.urgency === 'critical' || analysis.keyEntities.urgency === 'high') {
        signals.timeline = 'immediate';
      } else if (analysis.keyEntities.urgency === 'medium') {
        signals.timeline = '3 months';
      } else {
        signals.timeline = '6 months or more';
      }
    }

    // Property type signals
    if (analysis.keyEntities?.propertyType) {
      signals.propertyType = analysis.keyEntities.propertyType;
    }

    // Location signals
    if (analysis.keyEntities?.location) {
      signals.location = analysis.keyEntities.location;
    }

    // Motivation signals from category
    if (analysis.category) {
      if (['hot_lead', 'seller_lead', 'buyer_lead'].includes(analysis.category)) {
        signals.motivation = 'high - active buyer/seller';
      } else if (analysis.category === 'showing_request') {
        signals.motivation = 'high - ready to view properties';
      } else {
        signals.motivation = 'medium - inquiring';
      }
    }
  }

  // Default values for missing data
  signals.decisionMaker = 'unknown';
  signals.preApproved = 'unknown';
  
  return signals;
}

async function findOrCreateContactFromEmail(orgId: string, thread: any) {
  try {
    // Get participants from thread
    let participants = [];
    
    if (thread.participantsEnc) {
      try {
        const participantsBytes = await decryptForOrg(orgId, thread.participantsEnc, 'email:participants');
        const participantsStr = new TextDecoder().decode(participantsBytes);
        participants = participantsStr.split(',').map(p => p.trim());
      } catch (error) {
        console.warn('Failed to decrypt thread participants');
      }
    }

    if (participants.length === 0) {
      throw new Error('No participants found in email thread');
    }

    // Look for existing contact
    const existingContacts = await prisma.contact.findMany({
      where: { orgId }
    });

    for (const contact of existingContacts) {
      if (contact.emailEnc) {
        try {
          const emailBytes = await decryptForOrg(orgId, contact.emailEnc, 'contact:email');
          const email = new TextDecoder().decode(emailBytes);
          
          if (participants.some(p => p.toLowerCase().includes(email.toLowerCase()))) {
            return contact;
          }
        } catch (error) {
          continue;
        }
      }
    }

    // Create new contact from first participant (usually the sender)
    const primaryEmail = participants[0];
    const nameFromEmail = primaryEmail.split('@')[0].replace(/[._-]/g, ' ');
    
    const nameEnc = await encryptForOrg(orgId, nameFromEmail, 'contact:name');
    const emailEnc = await encryptForOrg(orgId, primaryEmail, 'contact:email');

    const contact = await prisma.contact.create({
      data: {
        orgId,
        nameEnc,
        emailEnc,
        status: 'lead',
        source: 'email_auto_qualification',
        tags: ['auto_created', 'from_email']
      }
    });

    return contact;
  } catch (error) {
    console.error('Error finding/creating contact from email:', error);
    throw error;
  }
}

async function bulkQualifyLeads(orgId: string, req: NextRequest) {
  const { leadIds, contactIds } = await req.json();

  const results = [];
  const entities = [];

  // Gather leads and contacts to process
  if (leadIds && leadIds.length > 0) {
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds }, orgId },
      include: { contact: true }
    });
    entities.push(...leads.map(l => ({ type: 'lead', data: l })));
  }

  if (contactIds && contactIds.length > 0) {
    const contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds }, orgId }
    });
    entities.push(...contacts.map(c => ({ type: 'contact', data: c })));
  }

  // Process each entity
  for (const entity of entities) {
    try {
      // Generate qualification responses from existing data
      const responses = generateQualificationResponsesFromData(entity.data);
      
      const result = await qualifyLead(orgId, {
        contactId: entity.type === 'contact' ? entity.data.id : entity.data.contactId,
        leadId: entity.type === 'lead' ? entity.data.id : undefined,
        responses,
        source: 'bulk_qualification'
      });

      results.push({
        id: entity.data.id,
        type: entity.type,
        success: true,
        qualification: result
      });
    } catch (error) {
      results.push({
        id: entity.data.id,
        type: entity.type,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return NextResponse.json({
    success: true,
    processed: results.length,
    results,
    summary: {
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  });
}

function generateQualificationResponsesFromData(entity: any): Record<string, any> {
  const responses: Record<string, any> = {};

  // Extract from lead data
  if (entity.propertyValue) {
    responses.budget = entity.propertyValue.toString();
  }

  if (entity.expectedCloseDate) {
    const daysUntilClose = Math.ceil(
      (new Date(entity.expectedCloseDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );
    
    if (daysUntilClose <= 30) {
      responses.timeline = 'immediate';
    } else if (daysUntilClose <= 90) {
      responses.timeline = '3 months';
    } else if (daysUntilClose <= 180) {
      responses.timeline = '6 months';
    } else {
      responses.timeline = '1 year or more';
    }
  }

  // Default assumptions for missing data
  responses.decisionMaker = 'unknown';
  responses.preApproved = 'unknown';
  responses.motivation = 'medium';

  return responses;
}

async function getQualificationForm(orgId: string) {
  // Return the dynamic qualification form structure
  return NextResponse.json({
    form: {
      title: 'Lead Qualification Form',
      description: 'Help us understand your property needs better',
      sections: [
        {
          title: 'Budget & Timeline',
          fields: [
            {
              id: 'budget',
              type: 'select',
              label: 'What is your budget range?',
              required: true,
              options: [
                { value: '100000', label: 'Under $100K' },
                { value: '250000', label: '$100K - $250K' },
                { value: '500000', label: '$250K - $500K' },
                { value: '750000', label: '$500K - $750K' },
                { value: '1000000', label: '$750K - $1M' },
                { value: '1500000', label: '$1M+' }
              ]
            },
            {
              id: 'timeline',
              type: 'select',
              label: 'When are you looking to buy/sell?',
              required: true,
              options: [
                { value: 'immediate', label: 'Immediately (ASAP)' },
                { value: '1 month', label: 'Within 1 month' },
                { value: '3 months', label: 'Within 3 months' },
                { value: '6 months', label: 'Within 6 months' },
                { value: '1 year', label: 'Within 1 year' },
                { value: 'just looking', label: 'Just looking/researching' }
              ]
            }
          ]
        },
        {
          title: 'Decision Making',
          fields: [
            {
              id: 'decisionMaker',
              type: 'select',
              label: 'Are you the primary decision maker?',
              required: true,
              options: [
                { value: 'yes', label: 'Yes, I make the final decision' },
                { value: 'spouse', label: 'Joint decision with spouse/partner' },
                { value: 'no', label: 'No, someone else decides' }
              ]
            },
            {
              id: 'preApproved',
              type: 'select',
              label: 'Are you pre-approved for a mortgage?',
              required: false,
              options: [
                { value: 'yes', label: 'Yes, I\'m pre-approved' },
                { value: 'cash', label: 'Cash buyer' },
                { value: 'no', label: 'Not yet, need pre-approval' },
                { value: 'not sure', label: 'Not sure what this means' }
              ]
            }
          ]
        },
        {
          title: 'Property Preferences',
          fields: [
            {
              id: 'propertyType',
              type: 'select',
              label: 'What type of property are you looking for?',
              required: false,
              options: [
                { value: 'single_family', label: 'Single Family Home' },
                { value: 'condo', label: 'Condominium' },
                { value: 'townhouse', label: 'Townhouse' },
                { value: 'multi_family', label: 'Multi-Family' },
                { value: 'land', label: 'Land/Lot' },
                { value: 'commercial', label: 'Commercial Property' }
              ]
            },
            {
              id: 'location',
              type: 'text',
              label: 'Preferred location/area?',
              placeholder: 'e.g., Downtown, Specific neighborhood, School district',
              required: false
            }
          ]
        },
        {
          title: 'Motivation',
          fields: [
            {
              id: 'motivation',
              type: 'textarea',
              label: 'What\'s driving your decision to buy/sell now?',
              placeholder: 'e.g., Job relocation, growing family, downsizing, investment',
              required: false
            }
          ]
        }
      ]
    },
    scoring: {
      description: 'Leads are scored 0-100 and categorized into tiers',
      tiers: {
        'A': { range: '80-100', description: 'Hot leads - immediate attention required' },
        'B': { range: '65-79', description: 'Warm leads - regular follow-up' },
        'C': { range: '45-64', description: 'Cold leads - nurturing sequence' },
        'D': { range: '0-44', description: 'Very cold - long-term nurturing' }
      }
    }
  });
}

/**
 * Get qualification data and statistics
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
    const action = url.searchParams.get('action');

    if (action === 'form') {
      return await getQualificationForm(orgId);
    }

    // Get qualification statistics
    const leads = await prisma.lead.findMany({
      where: { orgId },
      include: { contact: true }
    });

    // Analyze lead tiers from tags
    const tierStats = {
      A: leads.filter(l => l.tags?.includes('tier_a')).length,
      B: leads.filter(l => l.tags?.includes('tier_b')).length,
      C: leads.filter(l => l.tags?.includes('tier_c')).length,
      D: leads.filter(l => l.tags?.includes('tier_d')).length,
      unqualified: leads.filter(l => !l.tags?.some(t => t.startsWith('tier_'))).length
    };

    const recentQualifications = leads
      .filter(l => l.tags?.includes('ai_qualified'))
      .slice(0, 10)
      .map(l => ({
        id: l.id,
        title: l.title,
        tier: l.tags?.find(t => t.startsWith('tier_'))?.split('_')[1]?.toUpperCase() || 'Unknown',
        score: l.probabilityPercent || 0,
        createdAt: l.createdAt.toISOString()
      }));

    return NextResponse.json({
      stats: {
        totalLeads: leads.length,
        qualifiedLeads: leads.filter(l => l.tags?.includes('ai_qualified')).length,
        tierBreakdown: tierStats,
        averageScore: leads.reduce((sum, l) => sum + (l.probabilityPercent || 0), 0) / leads.length || 0
      },
      recentQualifications
    });

  } catch (error) {
    console.error('Failed to get qualification data:', error);
    return NextResponse.json(
      { error: 'Failed to get qualification data' },
      { status: 500 }
    );
  }
}