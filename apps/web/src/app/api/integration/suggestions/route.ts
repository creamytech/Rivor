import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { decryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';

/**
 * Get intelligent suggestions for cross-module actions
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
    const context = url.searchParams.get('context'); // 'tasks', 'contacts', 'calendar', 'inbox'
    const entityId = url.searchParams.get('entityId');

    const suggestions = [];

    // Get recent email threads with AI analysis that might need follow-up
    const recentThreads = await prisma.emailThread.findMany({
      where: {
        orgId,
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      },
      include: {
        messages: {
          take: 1,
          orderBy: { sentAt: 'desc' }
        },
        aiAnalysis: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    // Suggestions for high-priority email threads without tasks
    for (const thread of recentThreads) {
      const existingTask = await prisma.task.findFirst({
        where: { orgId, linkThreadId: thread.id }
      });

      if (!existingTask && thread.aiAnalysis) {
        const analysis = thread.aiAnalysis;
        
        // Suggest task creation for high-priority categories
        if (['hot_lead', 'showing_request', 'contract'].includes(analysis.category)) {
          let subject = 'Email Follow-up';
          if (thread.subjectEnc) {
            try {
              const subjectBytes = await decryptForOrg(orgId, thread.subjectEnc, 'email:subject');
              subject = new TextDecoder().decode(subjectBytes);
            } catch (error) {
              console.warn('Failed to decrypt thread subject:', error);
            }
          }

          suggestions.push({
            type: 'create_task',
            priority: analysis.category === 'hot_lead' ? 'high' : 'medium',
            title: `Follow up: ${subject}`,
            description: `Create a follow-up task for ${analysis.category.replace('_', ' ')} email`,
            action: 'create_task_from_email',
            data: {
              threadId: thread.id,
              suggestedTitle: `Follow up: ${subject}`,
              suggestedDescription: `Follow up on ${analysis.category.replace('_', ' ')} email from ${new Date(thread.updatedAt).toLocaleDateString()}`,
              priority: analysis.category === 'hot_lead' ? 'high' : 'medium',
              category: analysis.category
            },
            category: 'email_follow_up',
            urgency: analysis.priorityScore > 70 ? 'high' : 'medium'
          });
        }

        // Suggest calendar event for showing requests
        if (analysis.category === 'showing_request') {
          suggestions.push({
            type: 'schedule_meeting',
            priority: 'high',
            title: `Schedule property showing`,
            description: `Schedule a property showing based on email request`,
            action: 'create_calendar_event',
            data: {
              threadId: thread.id,
              suggestedTitle: 'Property Showing',
              suggestedDescription: `Property showing scheduled from email`,
              type: 'meeting',
              priority: 'high'
            },
            category: 'showing_request',
            urgency: 'high'
          });
        }
      }
    }

    // Get contacts without recent activity
    const staleContacts = await prisma.contact.findMany({
      where: {
        orgId,
        updatedAt: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // No update in 30 days
      },
      orderBy: { updatedAt: 'asc' },
      take: 10
    });

    for (const contact of staleContacts) {
      let contactName = 'Unknown Contact';
      if (contact.nameEnc) {
        try {
          const nameBytes = await decryptForOrg(orgId, contact.nameEnc, 'contact:name');
          contactName = new TextDecoder().decode(nameBytes);
        } catch (error) {
          console.warn('Failed to decrypt contact name:', error);
        }
      }

      suggestions.push({
        type: 'contact_follow_up',
        priority: 'low',
        title: `Follow up with ${contactName}`,
        description: `No recent activity - consider reaching out`,
        action: 'create_task_for_contact',
        data: {
          contactId: contact.id,
          suggestedTitle: `Follow up with ${contactName}`,
          suggestedDescription: `Check in with ${contactName} - no recent activity`,
          priority: 'low'
        },
        category: 'contact_outreach',
        urgency: 'low'
      });
    }

    // Get overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
        orgId,
        status: { in: ['pending', 'in_progress'] },
        dueAt: { lte: new Date() }
      },
      orderBy: { dueAt: 'asc' },
      take: 10
    });

    for (const task of overdueTasks) {
      suggestions.push({
        type: 'overdue_task',
        priority: 'high',
        title: `Overdue: ${task.title}`,
        description: `Task was due ${new Date(task.dueAt!).toLocaleDateString()}`,
        action: 'update_task',
        data: {
          taskId: task.id,
          title: task.title,
          dueAt: task.dueAt?.toISOString(),
          priority: task.priority
        },
        category: 'task_management',
        urgency: 'high'
      });
    }

    // Sort suggestions by urgency and priority
    const sortedSuggestions = suggestions.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      
      const aScore = (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 1) * 2 + 
                     (priorityOrder[a.priority as keyof typeof priorityOrder] || 1);
      const bScore = (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 1) * 2 + 
                     (priorityOrder[b.priority as keyof typeof priorityOrder] || 1);
      
      return bScore - aScore;
    });

    return NextResponse.json({
      suggestions: sortedSuggestions.slice(0, 10), // Top 10 suggestions
      stats: {
        total: suggestions.length,
        high_urgency: suggestions.filter(s => s.urgency === 'high').length,
        medium_urgency: suggestions.filter(s => s.urgency === 'medium').length,
        low_urgency: suggestions.filter(s => s.urgency === 'low').length,
        categories: {
          email_follow_up: suggestions.filter(s => s.category === 'email_follow_up').length,
          showing_request: suggestions.filter(s => s.category === 'showing_request').length,
          contact_outreach: suggestions.filter(s => s.category === 'contact_outreach').length,
          task_management: suggestions.filter(s => s.category === 'task_management').length
        }
      }
    });

  } catch (error) {
    console.error('Failed to get suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}