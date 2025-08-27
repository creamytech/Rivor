import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Smart Lead Alerts and Notifications System
 * Creates real-time notifications based on lead intelligence triggers
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
      type, 
      leadIntelligenceId, 
      threshold,
      conditions = [],
      userId 
    } = await req.json();

    if (!type || !leadIntelligenceId) {
      return NextResponse.json({ 
        error: 'Alert type and lead intelligence ID required' 
      }, { status: 400 });
    }

    // Verify the intelligence record exists
    const intelligence = await prisma.leadIntelligence.findFirst({
      where: { id: leadIntelligenceId, orgId },
      include: { lead: true, contact: true }
    });

    if (!intelligence) {
      return NextResponse.json({ 
        error: 'Lead intelligence record not found' 
      }, { status: 404 });
    }

    // Check if alert conditions are met
    const shouldTrigger = await evaluateAlertConditions(type, intelligence, threshold, conditions);

    if (shouldTrigger) {
      // Create notification
      const notification = await createIntelligenceNotification(
        orgId,
        userId || session.user.id,
        type,
        intelligence,
        threshold
      );

      return NextResponse.json({ 
        alert: {
          id: notification.id,
          type,
          triggered: true,
          leadId: intelligence.leadId,
          contactId: intelligence.contactId,
          message: notification.message,
          priority: notification.priority
        }
      });
    }

    return NextResponse.json({ 
      alert: {
        type,
        triggered: false,
        message: 'Conditions not met'
      }
    });

  } catch (error) {
    console.error('Failed to process intelligence alert:', error);
    return NextResponse.json(
      { error: 'Failed to process alert' },
      { status: 500 }
    );
  }
}

/**
 * Get active intelligence alerts
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
    const priority = url.searchParams.get('priority');
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const where: any = {
      orgId,
      type: { startsWith: 'intelligence_' } // Filter for intelligence-related notifications
    };

    if (priority) where.priority = priority;
    if (unreadOnly) where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // Group by priority for better organization
    const grouped = {
      high: notifications.filter(n => n.priority === 'high'),
      medium: notifications.filter(n => n.priority === 'medium'),
      low: notifications.filter(n => n.priority === 'low')
    };

    return NextResponse.json({
      alerts: notifications,
      grouped,
      summary: {
        total: notifications.length,
        unread: notifications.filter(n => !n.isRead).length,
        high_priority: grouped.high.length,
        medium_priority: grouped.medium.length,
        low_priority: grouped.low.length
      }
    });

  } catch (error) {
    console.error('Failed to get intelligence alerts:', error);
    return NextResponse.json(
      { error: 'Failed to get alerts' },
      { status: 500 }
    );
  }
}

async function evaluateAlertConditions(
  type: string, 
  intelligence: any, 
  threshold?: number, 
  conditions: any[] = []
): Promise<boolean> {
  switch (type) {
    case 'high_score':
      return intelligence.overallScore >= (threshold || 80);
      
    case 'high_conversion':
      return intelligence.conversionProbability >= (threshold || 0.8);
      
    case 'urgent_lead':
      return intelligence.urgencyScore >= (threshold || 85);
      
    case 'engagement_spike':
      return intelligence.engagementScore >= (threshold || 90);
      
    case 'score_increase':
      // Would need to compare with previous scores
      // For now, check if current score is above threshold
      return intelligence.overallScore >= (threshold || 70);
      
    case 'action_required':
      const actionRequiredInsights = await prisma.leadInsight.count({
        where: {
          leadIntelligenceId: intelligence.id,
          actionRequired: true,
          isRead: false
        }
      });
      return actionRequiredInsights >= (threshold || 1);
      
    case 'competitor_mention':
      return intelligence.competitorMentions && 
             intelligence.competitorMentions.length > 0;
             
    case 'price_sensitivity':
      return intelligence.priceSignals && 
             intelligence.priceSignals.budgetConcerns;
             
    case 'decision_timeframe':
      return intelligence.decisionTimeframe === 'immediate' ||
             intelligence.decisionTimeframe === 'short_term';
             
    default:
      // Custom conditions evaluation
      if (conditions.length > 0) {
        return conditions.every(condition => {
          const field = condition.field;
          const operator = condition.operator;
          const value = condition.value;
          const actualValue = intelligence[field];
          
          switch (operator) {
            case 'gte': return actualValue >= value;
            case 'lte': return actualValue <= value;
            case 'eq': return actualValue === value;
            case 'gt': return actualValue > value;
            case 'lt': return actualValue < value;
            case 'contains': return actualValue?.includes?.(value);
            default: return false;
          }
        });
      }
      return false;
  }
}

async function createIntelligenceNotification(
  orgId: string,
  userId: string,
  type: string,
  intelligence: any,
  threshold?: number
): Promise<any> {
  const messages = {
    high_score: `🎯 High-scoring lead detected! Score: ${intelligence.overallScore}/100`,
    high_conversion: `🚀 High conversion probability: ${Math.round(intelligence.conversionProbability * 100)}%`,
    urgent_lead: `⚡ Urgent lead requires immediate attention - Urgency score: ${intelligence.urgencyScore}/100`,
    engagement_spike: `📈 Engagement spike detected - Score: ${intelligence.engagementScore}/100`,
    score_increase: `📊 Lead score increased to ${intelligence.overallScore}/100`,
    action_required: `🎯 Lead intelligence insights require your attention`,
    competitor_mention: `👥 Competitor mentions detected in lead communications`,
    price_sensitivity: `💰 Price sensitivity indicators detected`,
    decision_timeframe: `⏰ Lead shows ${intelligence.decisionTimeframe.replace('_', ' ')} decision timeline`
  };

  const priorities = {
    high_score: 'high',
    high_conversion: 'high',
    urgent_lead: 'high',
    engagement_spike: 'medium',
    score_increase: 'medium',
    action_required: 'high',
    competitor_mention: 'medium',
    price_sensitivity: 'medium',
    decision_timeframe: 'high'
  };

  const leadName = intelligence.lead?.title || 
                  `Contact ${intelligence.contact?.id?.slice(-6)}` || 
                  'Unknown Lead';

  const title = `Smart Intelligence Alert: ${leadName}`;
  const message = messages[type as keyof typeof messages] || `Intelligence alert: ${type}`;
  const priority = priorities[type as keyof typeof priorities] || 'medium';

  return await prisma.notification.create({
    data: {
      orgId,
      userId,
      type: `intelligence_${type}`,
      title,
      message: `${message}\n\nLead: ${leadName}\nOverall Score: ${intelligence.overallScore}/100\nConversion Probability: ${Math.round(intelligence.conversionProbability * 100)}%`,
      priority
    }
  });
}

/**
 * Batch process intelligence alerts for all leads
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get all intelligence records for batch processing
    const intelligenceRecords = await prisma.leadIntelligence.findMany({
      where: { 
        orgId,
        lastAnalyzedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: { lead: true, contact: true }
    });

    const alertsTriggered = [];

    // Define standard alert rules
    const alertRules = [
      { type: 'high_score', threshold: 85 },
      { type: 'high_conversion', threshold: 0.85 },
      { type: 'urgent_lead', threshold: 80 },
      { type: 'engagement_spike', threshold: 85 },
      { type: 'action_required', threshold: 1 }
    ];

    for (const intelligence of intelligenceRecords) {
      for (const rule of alertRules) {
        const shouldTrigger = await evaluateAlertConditions(
          rule.type, 
          intelligence, 
          rule.threshold
        );

        if (shouldTrigger) {
          // Check if we already have a recent notification for this
          const recentNotification = await prisma.notification.findFirst({
            where: {
              orgId,
              type: `intelligence_${rule.type}`,
              message: { contains: intelligence.lead?.title || intelligence.contact?.id || '' },
              createdAt: {
                gte: new Date(Date.now() - 6 * 60 * 60 * 1000) // Last 6 hours
              }
            }
          });

          if (!recentNotification) {
            const notification = await createIntelligenceNotification(
              orgId,
              session.user.id || 'system',
              rule.type,
              intelligence,
              rule.threshold
            );

            alertsTriggered.push({
              type: rule.type,
              leadId: intelligence.leadId,
              contactId: intelligence.contactId,
              notificationId: notification.id,
              score: intelligence.overallScore,
              conversionProbability: intelligence.conversionProbability
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: intelligenceRecords.length,
      alertsTriggered: alertsTriggered.length,
      alerts: alertsTriggered
    });

  } catch (error) {
    console.error('Failed to process batch intelligence alerts:', error);
    return NextResponse.json(
      { error: 'Failed to process batch alerts' },
      { status: 500 }
    );
  }
}