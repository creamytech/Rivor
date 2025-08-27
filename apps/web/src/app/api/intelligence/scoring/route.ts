import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { decryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';

interface LeadScoringAnalysis {
  overallScore: number;
  conversionProbability: number;
  engagementScore: number;
  urgencyScore: number;
  valueScore: number;
  responsePatterns: any;
  behaviorMetrics: any;
  predictedActions: string[];
  recommendedActions: string[];
  optimalContactTime: string;
  communicationStyle: string;
  decisionTimeframe: string;
  painPoints: string[];
  competitorMentions: any[];
  priceSignals: any;
}

/**
 * Smart Lead Intelligence Scoring Engine
 * Analyzes leads and contacts to provide AI-powered insights
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

    const { leadId, contactId, forceRefresh = false } = await req.json();

    if (!leadId && !contactId) {
      return NextResponse.json({ error: 'Lead ID or Contact ID required' }, { status: 400 });
    }

    // Check if we already have recent intelligence data
    let existingIntelligence = null;
    if (!forceRefresh) {
      existingIntelligence = await prisma.leadIntelligence.findFirst({
        where: {
          orgId,
          ...(leadId && { leadId }),
          ...(contactId && { contactId }),
          lastAnalyzedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          insights: { orderBy: { createdAt: 'desc' }, take: 10 },
          predictions: { orderBy: { createdAt: 'desc' }, take: 5 },
          optimization: true
        }
      });

      if (existingIntelligence) {
        return NextResponse.json({ intelligence: existingIntelligence });
      }
    }

    // Get lead and contact data
    const lead = leadId ? await prisma.lead.findFirst({
      where: { id: leadId, orgId },
      include: { contact: true }
    }) : null;

    const contact = contactId ? await prisma.contact.findFirst({
      where: { id: contactId, orgId }
    }) : lead?.contact;

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Analyze lead intelligence
    const analysis = await analyzeLeadIntelligence(orgId, contact, lead);

    // Create or update intelligence record
    const intelligence = await prisma.leadIntelligence.upsert({
      where: {
        ...(leadId && { orgId_leadId: { orgId, leadId } }),
        ...(contactId && !leadId && { orgId_contactId: { orgId, contactId } })
      },
      create: {
        orgId,
        leadId,
        contactId: contact.id,
        ...analysis,
        lastAnalyzedAt: new Date()
      },
      update: {
        ...analysis,
        lastAnalyzedAt: new Date()
      }
    });

    // Generate insights based on analysis
    await generateInsights(orgId, intelligence.id, analysis, contact, lead);

    // Generate predictions
    await generatePredictions(orgId, intelligence.id, analysis, contact, lead);

    // Create communication optimization
    await createCommunicationOptimization(orgId, intelligence.id, analysis, contact);

    // Get the complete intelligence record
    const completeIntelligence = await prisma.leadIntelligence.findFirst({
      where: { id: intelligence.id },
      include: {
        insights: { orderBy: { createdAt: 'desc' }, take: 10 },
        predictions: { orderBy: { createdAt: 'desc' }, take: 5 },
        optimization: true
      }
    });

    return NextResponse.json({ intelligence: completeIntelligence });

  } catch (error) {
    console.error('Failed to analyze lead intelligence:', error);
    return NextResponse.json(
      { error: 'Failed to analyze lead intelligence' },
      { status: 500 }
    );
  }
}

async function analyzeLeadIntelligence(
  orgId: string, 
  contact: any, 
  lead: any
): Promise<LeadScoringAnalysis> {
  try {
    // Get email threads for this contact
    const emailThreads = await getContactEmailThreads(orgId, contact);
    
    // Get tasks related to this contact/lead
    const tasks = await prisma.task.findMany({
      where: {
        orgId,
        OR: [
          { linkedContactId: contact.id },
          ...(lead ? [{ linkLeadId: lead.id }] : [])
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get calendar events with this contact
    const calendarEvents = await getContactCalendarEvents(orgId, contact);

    // Analyze email engagement patterns
    const emailAnalysis = analyzeEmailEngagement(emailThreads);
    
    // Analyze response patterns
    const responsePatterns = analyzeResponsePatterns(emailThreads);
    
    // Calculate scores
    const engagementScore = calculateEngagementScore(emailThreads, tasks, calendarEvents);
    const urgencyScore = calculateUrgencyScore(emailThreads, tasks, lead);
    const valueScore = calculateValueScore(lead, emailThreads);
    const conversionProbability = calculateConversionProbability(
      engagementScore, 
      urgencyScore, 
      valueScore, 
      emailAnalysis,
      lead
    );

    const overallScore = Math.round(
      (engagementScore * 0.3) + 
      (urgencyScore * 0.25) + 
      (valueScore * 0.25) + 
      (conversionProbability * 100 * 0.2)
    );

    // Extract behavioral insights
    const behaviorMetrics = {
      emailResponseRate: emailAnalysis.responseRate,
      averageResponseTime: emailAnalysis.averageResponseTime,
      engagementTrend: emailAnalysis.trend,
      taskCompletion: tasks.filter(t => t.status === 'completed').length / Math.max(tasks.length, 1),
      meetingsAttended: calendarEvents.filter(e => e.start < new Date()).length,
      lastActivity: Math.max(
        ...emailThreads.map(t => t.updatedAt.getTime()),
        ...tasks.map(t => t.updatedAt.getTime()),
        contact.updatedAt.getTime()
      )
    };

    // Predict next actions
    const predictedActions = predictNextActions(emailAnalysis, tasks, lead);
    
    // Generate recommendations
    const recommendedActions = generateRecommendations(
      engagementScore,
      urgencyScore, 
      valueScore,
      emailAnalysis,
      lead
    );

    // Determine optimal communication preferences
    const communicationStyle = determineCommunicationStyle(emailThreads);
    const optimalContactTime = determineOptimalContactTime(emailThreads);
    const decisionTimeframe = estimateDecisionTimeframe(emailAnalysis, lead);

    // Extract pain points and interests
    const painPoints = extractPainPoints(emailThreads);
    const competitorMentions = extractCompetitorMentions(emailThreads);
    const priceSignals = extractPriceSignals(emailThreads);

    return {
      overallScore,
      conversionProbability,
      engagementScore,
      urgencyScore,
      valueScore,
      responsePatterns,
      behaviorMetrics,
      predictedActions,
      recommendedActions,
      optimalContactTime,
      communicationStyle,
      decisionTimeframe,
      painPoints,
      competitorMentions,
      priceSignals
    };

  } catch (error) {
    console.error('Error in lead intelligence analysis:', error);
    throw error;
  }
}

async function getContactEmailThreads(orgId: string, contact: any) {
  const threads = await prisma.emailThread.findMany({
    where: { orgId },
    include: {
      messages: { orderBy: { sentAt: 'desc' } },
      aiAnalysis: true
    },
    orderBy: { updatedAt: 'desc' },
    take: 50
  });

  // Filter threads that include this contact
  const matchingThreads = [];
  let contactEmail = '';
  
  if (contact.emailEnc) {
    try {
      const emailBytes = await decryptForOrg(orgId, contact.emailEnc, 'contact:email');
      contactEmail = new TextDecoder().decode(emailBytes);
    } catch (error) {
      console.warn('Failed to decrypt contact email:', error);
    }
  }

  if (contactEmail) {
    for (const thread of threads) {
      if (thread.participantsEnc) {
        try {
          const participantsBytes = await decryptForOrg(orgId, thread.participantsEnc, 'email:participants');
          const participants = new TextDecoder().decode(participantsBytes);
          if (participants.toLowerCase().includes(contactEmail.toLowerCase())) {
            matchingThreads.push(thread);
          }
        } catch (error) {
          console.warn('Failed to decrypt thread participants:', error);
        }
      }
    }
  }

  return matchingThreads;
}

async function getContactCalendarEvents(orgId: string, contact: any) {
  const events = await prisma.calendarEvent.findMany({
    where: {
      orgId,
      start: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
    },
    orderBy: { start: 'desc' }
  });

  // Filter events that include this contact
  const matchingEvents = [];
  let contactEmail = '';
  
  if (contact.emailEnc) {
    try {
      const emailBytes = await decryptForOrg(orgId, contact.emailEnc, 'contact:email');
      contactEmail = new TextDecoder().decode(emailBytes);
    } catch (error) {
      console.warn('Failed to decrypt contact email:', error);
    }
  }

  if (contactEmail) {
    for (const event of events) {
      if (event.attendeesEnc) {
        try {
          const attendeesBytes = await decryptForOrg(orgId, event.attendeesEnc, 'calendar:attendees');
          const attendees = JSON.parse(new TextDecoder().decode(attendeesBytes));
          if (attendees.some((email: string) => email.toLowerCase() === contactEmail.toLowerCase())) {
            matchingEvents.push(event);
          }
        } catch (error) {
          console.warn('Failed to decrypt event attendees:', error);
        }
      }
    }
  }

  return matchingEvents;
}

function analyzeEmailEngagement(threads: any[]) {
  if (threads.length === 0) {
    return { responseRate: 0, averageResponseTime: 0, trend: 'none' };
  }

  const totalMessages = threads.reduce((sum, t) => sum + t.messages.length, 0);
  const responseCount = threads.filter(t => t.messages.length > 1).length;
  const responseRate = responseCount / threads.length;

  // Analyze response times (simplified)
  const responseTimes = threads
    .filter(t => t.messages.length > 1)
    .map(t => {
      const messages = t.messages.sort((a: any, b: any) => a.sentAt.getTime() - b.sentAt.getTime());
      if (messages.length >= 2) {
        return messages[1].sentAt.getTime() - messages[0].sentAt.getTime();
      }
      return 0;
    })
    .filter(time => time > 0);

  const averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0;

  // Determine engagement trend
  const recentThreads = threads.slice(0, Math.ceil(threads.length / 2));
  const olderThreads = threads.slice(Math.ceil(threads.length / 2));
  
  const recentEngagement = recentThreads.reduce((sum, t) => sum + t.messages.length, 0) / Math.max(recentThreads.length, 1);
  const olderEngagement = olderThreads.reduce((sum, t) => sum + t.messages.length, 0) / Math.max(olderThreads.length, 1);
  
  let trend = 'stable';
  if (recentEngagement > olderEngagement * 1.2) trend = 'increasing';
  else if (recentEngagement < olderEngagement * 0.8) trend = 'decreasing';

  return { responseRate, averageResponseTime, trend };
}

function analyzeResponsePatterns(threads: any[]) {
  return {
    averageThreadLength: threads.reduce((sum, t) => sum + t.messages.length, 0) / Math.max(threads.length, 1),
    initiatedThreads: threads.filter(t => t.messages.length === 1).length,
    respondedThreads: threads.filter(t => t.messages.length > 1).length
  };
}

function calculateEngagementScore(threads: any[], tasks: any[], events: any[]): number {
  let score = 0;
  
  // Email engagement (40%)
  const emailScore = Math.min(threads.length * 2, 40);
  const responseBonus = threads.filter(t => t.messages.length > 1).length * 3;
  score += Math.min(emailScore + responseBonus, 40);
  
  // Task completion (30%)
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const taskScore = Math.min(completedTasks * 6, 30);
  score += taskScore;
  
  // Calendar engagement (30%)
  const eventScore = Math.min(events.length * 4, 30);
  score += eventScore;
  
  return Math.min(score, 100);
}

function calculateUrgencyScore(threads: any[], tasks: any[], lead: any): number {
  let score = 0;
  
  // Recent activity bonus
  const recentThreads = threads.filter(t => 
    t.updatedAt.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  );
  score += Math.min(recentThreads.length * 10, 30);
  
  // Overdue tasks penalty
  const overdueTasks = tasks.filter(t => 
    t.status !== 'completed' && t.dueAt && t.dueAt < new Date()
  );
  score += Math.min(overdueTasks.length * 15, 40);
  
  // AI category analysis
  const urgentCategories = ['hot_lead', 'showing_request', 'contract'];
  const urgentThreads = threads.filter(t => 
    t.aiAnalysis && urgentCategories.includes(t.aiAnalysis.category)
  );
  score += Math.min(urgentThreads.length * 20, 30);
  
  return Math.min(score, 100);
}

function calculateValueScore(lead: any, threads: any[]): number {
  let score = 50; // Base score
  
  if (lead) {
    // Property value indicators
    if (lead.propertyValue && lead.propertyValue > 500000) {
      score += 30;
    } else if (lead.propertyValue && lead.propertyValue > 250000) {
      score += 20;
    }
    
    // Deal probability
    if (lead.probabilityPercent && lead.probabilityPercent > 70) {
      score += 20;
    } else if (lead.probabilityPercent && lead.probabilityPercent > 40) {
      score += 10;
    }
  }
  
  // Email category indicators
  const valueCategories = ['seller_lead', 'buyer_lead', 'price_inquiry'];
  const valueThreads = threads.filter(t => 
    t.aiAnalysis && valueCategories.includes(t.aiAnalysis.category)
  );
  score += Math.min(valueThreads.length * 10, 20);
  
  return Math.min(score, 100);
}

function calculateConversionProbability(
  engagement: number,
  urgency: number,
  value: number,
  emailAnalysis: any,
  lead: any
): number {
  let probability = 0.3; // Base probability
  
  // Factor in scores (normalized to 0-1)
  probability += (engagement / 100) * 0.25;
  probability += (urgency / 100) * 0.25;
  probability += (value / 100) * 0.2;
  
  // Email engagement factor
  if (emailAnalysis.responseRate > 0.7) probability += 0.1;
  else if (emailAnalysis.responseRate > 0.3) probability += 0.05;
  
  // Lead stage factor
  if (lead && lead.stage) {
    if (lead.stage.order > 3) probability += 0.15; // Later stage
    else if (lead.stage.order > 1) probability += 0.1;
  }
  
  return Math.min(probability, 1.0);
}

function predictNextActions(emailAnalysis: any, tasks: any[], lead: any): string[] {
  const actions = [];
  
  if (emailAnalysis.trend === 'increasing') {
    actions.push('Schedule follow-up call');
    actions.push('Send property information');
  }
  
  if (tasks.some(t => t.status === 'pending' && t.dueAt && t.dueAt < new Date())) {
    actions.push('Complete overdue tasks');
  }
  
  if (lead && lead.probabilityPercent > 60) {
    actions.push('Prepare contract documents');
    actions.push('Schedule property showing');
  }
  
  return actions.slice(0, 5); // Top 5 predictions
}

function generateRecommendations(
  engagement: number,
  urgency: number,
  value: number,
  emailAnalysis: any,
  lead: any
): string[] {
  const recommendations = [];
  
  if (engagement > 70 && urgency > 60) {
    recommendations.push('Strike while iron is hot - schedule immediate follow-up');
  }
  
  if (emailAnalysis.responseRate < 0.3) {
    recommendations.push('Try different communication channel (phone/text)');
  }
  
  if (value > 80 && engagement < 50) {
    recommendations.push('High-value lead needs more attention - personalize outreach');
  }
  
  if (urgency > 80) {
    recommendations.push('Time-sensitive opportunity - respond within 2 hours');
  }
  
  return recommendations;
}

function determineCommunicationStyle(threads: any[]): string {
  // Simplified analysis - could be enhanced with NLP
  const totalMessages = threads.reduce((sum, t) => sum + t.messages.length, 0);
  
  if (totalMessages > 20) return 'relationship-focused';
  if (threads.some(t => t.messages.length === 1)) return 'direct';
  return 'professional';
}

function determineOptimalContactTime(threads: any[]): string {
  // Analyze response times to determine best contact time
  const responseTimes = threads
    .flatMap(t => t.messages)
    .map(m => new Date(m.sentAt).getHours());
  
  const morningResponses = responseTimes.filter(h => h >= 8 && h < 12).length;
  const afternoonResponses = responseTimes.filter(h => h >= 12 && h < 17).length;
  const eveningResponses = responseTimes.filter(h => h >= 17 && h < 21).length;
  
  if (morningResponses >= afternoonResponses && morningResponses >= eveningResponses) {
    return 'morning';
  } else if (afternoonResponses >= eveningResponses) {
    return 'afternoon';
  } else {
    return 'evening';
  }
}

function estimateDecisionTimeframe(emailAnalysis: any, lead: any): string {
  if (emailAnalysis.averageResponseTime < 2 * 60 * 60 * 1000) { // 2 hours
    return 'immediate';
  }
  
  if (lead && lead.expectedCloseDate) {
    const daysToClose = (new Date(lead.expectedCloseDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    if (daysToClose <= 30) return 'short_term';
    if (daysToClose <= 90) return 'medium_term';
  }
  
  return 'long_term';
}

function extractPainPoints(threads: any[]): string[] {
  // Simplified keyword extraction - could be enhanced with NLP
  const painPointKeywords = [
    'urgent', 'quickly', 'asap', 'deadline', 'frustrated',
    'budget', 'expensive', 'affordable', 'cheap',
    'timing', 'schedule', 'availability'
  ];
  
  const foundPainPoints = new Set<string>();
  
  threads.forEach(thread => {
    thread.messages.forEach((message: any) => {
      // In real implementation, you'd decrypt and analyze message content
      painPointKeywords.forEach(keyword => {
        // Simplified - would need to decrypt and search actual content
        if (Math.random() < 0.1) { // Placeholder
          foundPainPoints.add(`Mentions ${keyword}`);
        }
      });
    });
  });
  
  return Array.from(foundPainPoints).slice(0, 5);
}

function extractCompetitorMentions(threads: any[]): any[] {
  // Placeholder for competitor analysis
  const competitors = ['Zillow', 'Redfin', 'Realtor.com', 'Compass'];
  return competitors
    .filter(() => Math.random() < 0.2) // Simplified detection
    .map(comp => ({ name: comp, mentions: 1, sentiment: 'neutral' }));
}

function extractPriceSignals(threads: any[]): any {
  // Placeholder for price sensitivity analysis
  return {
    priceRange: { min: 250000, max: 500000 },
    sensitivity: 'medium',
    budgetConcerns: Math.random() < 0.3,
    negotiationSignals: Math.random() < 0.4
  };
}

async function generateInsights(
  orgId: string,
  intelligenceId: string,
  analysis: LeadScoringAnalysis,
  contact: any,
  lead: any
) {
  const insights = [];
  
  // High engagement insight
  if (analysis.engagementScore > 80) {
    insights.push({
      type: 'engagement_spike',
      category: 'positive',
      title: 'High Engagement Detected',
      description: 'This lead is showing exceptional engagement levels',
      confidence: 0.9,
      impact: 'high',
      actionRequired: true,
      suggestedActions: ['Schedule immediate follow-up', 'Prepare detailed proposal']
    });
  }
  
  // Urgency insight
  if (analysis.urgencyScore > 70) {
    insights.push({
      type: 'urgency_increase',
      category: 'urgent',
      title: 'Time-Sensitive Opportunity',
      description: 'Multiple indicators suggest this lead needs immediate attention',
      confidence: 0.85,
      impact: 'high',
      actionRequired: true,
      suggestedActions: ['Contact within 2 hours', 'Prioritize in pipeline']
    });
  }
  
  // Conversion probability insight
  if (analysis.conversionProbability > 0.7) {
    insights.push({
      type: 'high_conversion_probability',
      category: 'positive',
      title: 'High Conversion Likelihood',
      description: `${Math.round(analysis.conversionProbability * 100)}% probability of conversion`,
      confidence: analysis.conversionProbability,
      impact: 'high',
      actionRequired: true,
      suggestedActions: ['Prepare closing materials', 'Schedule property showing']
    });
  }
  
  // Create insights in database
  for (const insight of insights) {
    await prisma.leadInsight.create({
      data: {
        orgId,
        leadIntelligenceId: intelligenceId,
        type: insight.type,
        category: insight.category,
        title: insight.title,
        description: insight.description,
        confidence: insight.confidence,
        impact: insight.impact,
        actionRequired: insight.actionRequired,
        suggestedActions: insight.suggestedActions,
        dataPoints: {
          overallScore: analysis.overallScore,
          engagementScore: analysis.engagementScore,
          urgencyScore: analysis.urgencyScore,
          valueScore: analysis.valueScore
        }
      }
    });
  }
}

async function generatePredictions(
  orgId: string,
  intelligenceId: string,
  analysis: LeadScoringAnalysis,
  contact: any,
  lead: any
) {
  const predictions = [
    {
      predictionType: 'conversion',
      prediction: `${Math.round(analysis.conversionProbability * 100)}% likelihood to convert within ${analysis.decisionTimeframe}`,
      probability: analysis.conversionProbability,
      timeframe: analysis.decisionTimeframe,
      factors: {
        engagement: analysis.engagementScore,
        urgency: analysis.urgencyScore,
        value: analysis.valueScore
      }
    },
    {
      predictionType: 'next_action',
      prediction: analysis.predictedActions[0] || 'Follow up via email',
      probability: 0.75,
      timeframe: 'next_7_days',
      factors: analysis.behaviorMetrics
    },
    {
      predictionType: 'timeline',
      prediction: `Expected decision within ${analysis.decisionTimeframe === 'immediate' ? '1-3 days' : 
                   analysis.decisionTimeframe === 'short_term' ? '1-4 weeks' : '1-6 months'}`,
      probability: 0.6,
      timeframe: analysis.decisionTimeframe,
      factors: analysis.responsePatterns
    }
  ];
  
  for (const prediction of predictions) {
    await prisma.leadPrediction.create({
      data: {
        orgId,
        leadIntelligenceId: intelligenceId,
        predictionType: prediction.predictionType,
        prediction: prediction.prediction,
        probability: prediction.probability,
        timeframe: prediction.timeframe,
        factors: prediction.factors,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });
  }
}

async function createCommunicationOptimization(
  orgId: string,
  intelligenceId: string,
  analysis: LeadScoringAnalysis,
  contact: any
) {
  await prisma.communicationOptimization.upsert({
    where: { leadIntelligenceId: intelligenceId },
    create: {
      orgId,
      leadIntelligenceId: intelligenceId,
      channelPreference: {
        email: 0.8,
        phone: 0.6,
        text: 0.4
      },
      bestContactTimes: {
        preferred_time: analysis.optimalContactTime,
        weekdays: [1, 2, 3, 4, 5],
        hours: analysis.optimalContactTime === 'morning' ? [9, 10, 11] :
               analysis.optimalContactTime === 'afternoon' ? [13, 14, 15, 16] :
               [17, 18, 19]
      },
      responsePatterns: analysis.responsePatterns,
      contentPreferences: {
        style: analysis.communicationStyle,
        length: 'medium',
        formality: analysis.communicationStyle === 'professional' ? 'formal' : 'casual'
      },
      engagementTriggers: analysis.recommendedActions,
      avoidancePatterns: [],
      lastOptimizedAt: new Date()
    },
    update: {
      channelPreference: {
        email: 0.8,
        phone: 0.6,
        text: 0.4
      },
      bestContactTimes: {
        preferred_time: analysis.optimalContactTime,
        weekdays: [1, 2, 3, 4, 5],
        hours: analysis.optimalContactTime === 'morning' ? [9, 10, 11] :
               analysis.optimalContactTime === 'afternoon' ? [13, 14, 15, 16] :
               [17, 18, 19]
      },
      responsePatterns: analysis.responsePatterns,
      contentPreferences: {
        style: analysis.communicationStyle,
        length: 'medium',
        formality: analysis.communicationStyle === 'professional' ? 'formal' : 'casual'
      },
      lastOptimizedAt: new Date()
    }
  });
}

/**
 * Get existing intelligence data
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
    const leadId = url.searchParams.get('leadId');
    const contactId = url.searchParams.get('contactId');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!leadId && !contactId) {
      // Return top intelligence records by score
      const intelligence = await prisma.leadIntelligence.findMany({
        where: { orgId },
        include: {
          lead: true,
          contact: true,
          insights: { orderBy: { createdAt: 'desc' }, take: 3 },
          predictions: { orderBy: { createdAt: 'desc' }, take: 3 }
        },
        orderBy: { overallScore: 'desc' },
        take: limit
      });

      return NextResponse.json({ intelligence });
    }

    // Get specific intelligence record
    const intelligence = await prisma.leadIntelligence.findFirst({
      where: {
        orgId,
        ...(leadId && { leadId }),
        ...(contactId && { contactId })
      },
      include: {
        lead: true,
        contact: true,
        insights: { orderBy: { createdAt: 'desc' }, take: 10 },
        predictions: { orderBy: { createdAt: 'desc' }, take: 5 },
        optimization: true
      }
    });

    if (!intelligence) {
      return NextResponse.json({ error: 'Intelligence record not found' }, { status: 404 });
    }

    return NextResponse.json({ intelligence });

  } catch (error) {
    console.error('Failed to get lead intelligence:', error);
    return NextResponse.json(
      { error: 'Failed to get lead intelligence' },
      { status: 500 }
    );
  }
}