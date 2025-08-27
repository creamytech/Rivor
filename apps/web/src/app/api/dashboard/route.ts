import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db-pool';
import { decryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(_req: NextRequest) {
  try {
    // Skip auth in development
    if (process.env.NODE_ENV === 'development') {
      return Response.json({
        userName: 'Dev User',
        showOnboarding: false,
        hasEmailIntegration: true,
        hasCalendarIntegration: true,
        unreadCount: 5,
        recentThreads: [
          {
            id: 'demo-1',
            subject: 'Property Inquiry - 123 Main St',
            participants: 'john.doe@example.com',
            lastMessageAt: new Date(),
            messageCount: 3,
            unreadCount: 1
          }
        ],
        upcomingEvents: [
          {
            id: 'demo-event-1',
            title: 'Property Showing - 456 Oak Ave',
            start: new Date(Date.now() + 86400000),
            end: new Date(Date.now() + 86400000 + 3600000),
            location: '456 Oak Ave'
          }
        ],
        calendarStats: { todayCount: 2, upcomingCount: 5 },
        pipelineStats: [],
        totalActiveLeads: 12,
        tokenHealth: []
      });
    }

    const session = await auth();

    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return new Response('Organization not found', { status: 403 });
    }

    // Verify the user is a member of this organization
    const membership = await prisma.orgMember.findFirst({
      where: {
        orgId,
        user: { email: session.user.email }
      },
      select: { role: true }
    });

    if (!membership) {
      return new Response('Forbidden', { status: 403 });
    }

    const userName = session.user.name || session.user.email.split('@')[0] || 'there';
    const userEmail = session.user.email;

    // Log dashboard access
    logger.userAction('dashboard_access', userEmail || 'unknown', orgId || 'unknown');

    // Fetch real email data
    let unreadCount = 0;
    let recentThreads: any[] = [];
    
    if (orgId) {
      try {
        
        // Get unread count
        unreadCount = await prisma.emailMessage.count({
          where: {
            orgId
          }
        });

        // Check total threads first
        const totalThreads = await prisma.emailThread.count({
          where: { orgId }
        });

        // Get recent threads with decrypted data
        const threads = await prisma.emailThread.findMany({
          where: { orgId },
          include: {
            _count: {
              select: { messages: true }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: 20
        });
        
        console.log('Recent thread sample:', threads.length > 0 ? {
          id: threads[0].id,
          subjectEnc: !!threads[0].subjectEnc,
          participantsEnc: !!threads[0].participantsEnc,
          updatedAt: threads[0].updatedAt,
          messageCount: threads[0]._count.messages
        } : 'No threads');

        // Decrypt thread data for display - get subject from latest message like inbox does
        recentThreads = await Promise.all(threads.map(async (thread) => {
          try {
            // Get the latest message for this thread to extract real data
            const latestMessage = await prisma.emailMessage.findFirst({
              where: { threadId: thread.id },
              select: {
                subjectEnc: true,
                fromEnc: true,
                toEnc: true,
                sentAt: true
              },
              orderBy: { sentAt: 'desc' }
            });

            let subject = 'No Subject';
            let participants = 'Email Participants';

            if (latestMessage?.subjectEnc) {
              const subjectBytes = await decryptForOrg(orgId, latestMessage.subjectEnc, 'email:subject');
              subject = new TextDecoder().decode(subjectBytes);
            }

            // Get participants from latest message
            if (latestMessage?.fromEnc) {
              const fromBytes = await decryptForOrg(orgId, latestMessage.fromEnc, 'email:from');
              const from = new TextDecoder().decode(fromBytes);
              participants = from;
            }
            
            return {
              id: thread.id,
              subject: subject || 'Email Thread',
              participants: participants || 'Email Participants',
              lastMessageAt: thread.updatedAt,
              messageCount: thread._count.messages,
              unreadCount: 0
            };
          } catch (error) {
            console.error('Failed to decrypt thread data:', error);
            return {
              id: thread.id,
              subject: 'Email Thread',
              participants: 'Email Participants',
              lastMessageAt: thread.updatedAt,
              messageCount: thread._count.messages,
              unreadCount: 0
            };
          }
        }));
      } catch (error) {
        console.error('Failed to fetch email data:', error);
        unreadCount = 0;
        recentThreads = [];
      }
    } else {
    }

    // Fetch calendar data
    let upcomingEvents: any[] = [];
    let calendarStats = { todayCount: 0, upcomingCount: 0 };
    
    if (orgId) {
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Check total events first
        const totalEvents = await prisma.calendarEvent.count({
          where: { orgId }
        });

        // Get today's events
        const todayEvents = await prisma.calendarEvent.count({
          where: {
            orgId,
            start: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
          }
        });

        // Get upcoming events
        const upcomingEventsCount = await prisma.calendarEvent.count({
          where: {
            orgId,
            start: {
              gte: now,
              lte: nextWeek
            }
          }
        });

        // Get actual upcoming events for display (or recent past events if no upcoming)
        let events = await prisma.calendarEvent.findMany({
          where: {
            orgId,
            start: {
              gte: now
            }
          },
          orderBy: { start: 'asc' },
          take: 10
        });

        // If no upcoming events, get recent past events instead
        if (events.length === 0) {
          events = await prisma.calendarEvent.findMany({
            where: {
              orgId,
              start: {
                lt: now
              }
            },
            orderBy: { start: 'desc' },
            take: 10
          });
        }
        
        console.log('Recent event sample:', events.length > 0 ? {
          id: events[0].id,
          titleEnc: !!events[0].titleEnc,
          locationEnc: !!events[0].locationEnc,
          start: events[0].start,
          end: events[0].end
        } : 'No events');

        // Decrypt event data
        upcomingEvents = await Promise.all(events.map(async (event) => {
          try {
            let title = 'Untitled Event';
            let location = null;

            if (event.titleEnc) {
              try {
                const titleBytes = await decryptForOrg(orgId, event.titleEnc, 'calendar:title');
                title = new TextDecoder().decode(titleBytes);
              } catch (decryptError) {
                console.error('Failed to decrypt title:', decryptError);
                title = 'Calendar Event';
              }
            }

            if (event.locationEnc) {
              try {
                const locationBytes = await decryptForOrg(orgId, event.locationEnc, 'calendar:location');
                location = new TextDecoder().decode(locationBytes);
              } catch (decryptError) {
                console.error('Failed to decrypt location:', decryptError);
                location = null;
              }
            }
            
            return {
              id: event.id,
              title: title || 'Calendar Event',
              start: event.start,
              end: event.end,
              location: location
            };
          } catch (error) {
            console.error('Failed to process event data:', error);
            return {
              id: event.id,
              title: 'Calendar Event',
              start: event.start,
              end: event.end,
              location: null
            };
          }
        }));

        calendarStats = {
          todayCount: todayEvents,
          upcomingCount: upcomingEventsCount
        };
      } catch (error) {
        console.error('Failed to fetch calendar data:', error);
        upcomingEvents = [];
        calendarStats = { todayCount: 0, upcomingCount: 0 };
      }
    }

    // Check if user has email accounts connected
    let hasEmailAccounts = false;
    let hasCalendarAccounts = false;
    
    if (orgId) {
      try {
        const emailAccounts = await prisma.emailAccount.count({
          where: { orgId, status: 'connected' }
        });
        hasEmailAccounts = emailAccounts > 0;
        
        const calendarAccounts = await prisma.calendarAccount.count({
          where: { orgId, status: 'connected' }
        });
        hasCalendarAccounts = calendarAccounts > 0;
      } catch (error) {
        console.error('Failed to check accounts:', error);
      }
    }

    // Fetch contacts data
    let totalContacts = 0;
    let recentContacts: any[] = [];
    
    if (orgId) {
      try {
        totalContacts = await prisma.contact.count({
          where: { orgId }
        });
        
        const contacts = await prisma.contact.findMany({
          where: { orgId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, nameEnc: true, emailEnc: true, createdAt: true }
        });
        
        recentContacts = await Promise.all(contacts.map(async (contact) => {
          try {
            let name = 'Contact';
            let email = '';
            
            if (contact.nameEnc) {
              const nameBytes = await decryptForOrg(orgId, contact.nameEnc, 'contact:name');
              name = new TextDecoder().decode(nameBytes);
            }
            
            if (contact.emailEnc) {
              const emailBytes = await decryptForOrg(orgId, contact.emailEnc, 'contact:email');
              email = new TextDecoder().decode(emailBytes);
            }
            
            return {
              id: contact.id,
              name,
              email,
              createdAt: contact.createdAt
            };
          } catch (error) {
            console.error('Failed to decrypt contact data:', error);
            return {
              id: contact.id,
              name: 'Contact',
              email: '',
              createdAt: contact.createdAt
            };
          }
        }));
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      }
    }

    // Fetch tasks data
    let totalTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;
    let upcomingTasks: any[] = [];
    let recentActivities: any[] = [];
    
    if (orgId) {
      try {
        totalTasks = await prisma.task.count({
          where: { orgId }
        });
        
        pendingTasks = await prisma.task.count({
          where: { orgId, status: 'pending' }
        });
        
        overdueTasks = await prisma.task.count({
          where: { 
            orgId, 
            status: { in: ['pending', 'in_progress'] },
            dueAt: { lt: new Date() }
          }
        });
        
        // Get upcoming tasks for today and next 7 days
        const tasks = await prisma.task.findMany({
          where: {
            orgId,
            status: { in: ['pending', 'in_progress'] },
            OR: [
              { dueAt: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
              { dueAt: null } // Include tasks without due date
            ]
          },
          orderBy: [
            { dueAt: 'asc' },
            { createdAt: 'desc' }
          ],
          take: 10,
          include: {
            lead: {
              select: { id: true, title: true }
            }
          }
        });
        
        upcomingTasks = tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueAt ? new Date(task.dueAt).toLocaleString() : 'No due date',
          priority: task.priority as 'high' | 'medium' | 'low',
          type: 'follow-up', // Default type
          contact: task.lead?.title,
          completed: task.status === 'completed'
        }));
        
        // Create recent activities from various sources
        const recentTasks = await prisma.task.findMany({
          where: { orgId },
          orderBy: { updatedAt: 'desc' },
          take: 3
        });
        
        recentActivities = [
          ...recentTasks.map(task => ({
            id: task.id,
            type: 'task' as const,
            title: task.title,
            description: task.description || 'Task updated',
            time: getTimeAgo(task.updatedAt),
            status: task.status === 'completed' ? 'completed' as const : 'pending' as const,
            contact: undefined,
            value: undefined
          })),
          ...recentThreads.slice(0, 2).map(thread => ({
            id: thread.id,
            type: 'email' as const,
            title: thread.subject,
            description: `New email from ${thread.participants}`,
            time: getTimeAgo(thread.lastMessageAt),
            status: 'pending' as const,
            contact: thread.participants,
            value: undefined
          })),
          ...upcomingEvents.slice(0, 2).map(event => ({
            id: event.id,
            type: 'meeting' as const,
            title: event.title,
            description: event.location ? `Meeting at ${event.location}` : 'Scheduled meeting',
            time: getTimeAgo(event.start),
            status: new Date(event.start) < new Date() ? 'completed' as const : 'pending' as const,
            contact: undefined,
            value: undefined
          }))
        ].slice(0, 5);
        
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      }
    }

    // Fetch pipeline data
    let activeLeads = 0;
    let totalLeads = 0;
    
    if (orgId) {
      try {
        totalLeads = await prisma.lead.count({
          where: { orgId }
        });
        
        activeLeads = await prisma.lead.count({
          where: { 
            orgId,
            status: { not: 'closed' }
          }
        });
      } catch (error) {
        console.error('Failed to fetch pipeline data:', error);
      }
    }

    // Return comprehensive dashboard data
    return Response.json({
      userName,
      showOnboarding: !hasEmailAccounts && !hasCalendarAccounts,
      hasEmailIntegration: hasEmailAccounts,
      hasCalendarIntegration: hasCalendarAccounts,
      
      // Metrics for dashboard cards
      activeLeads,
      leadsChange: 0, // Could calculate from historical data
      totalContacts,
      contactsChange: 0, // Could calculate from historical data  
      unreadEmails: unreadCount,
      upcomingTasks: pendingTasks,
      
      // Activity data
      recentActivities,
      upcomingTasks: upcomingTasks.slice(0, 5),
      
      // Calendar data
      recentThreads,
      upcomingEvents,
      calendarStats,
      
      // Additional stats
      totalTasks,
      pendingTasks,
      overdueTasks,
      recentContacts,
      
      // Legacy fields
      pipelineStats: [],
      totalActiveLeads: activeLeads,
      tokenHealth: []
    });
    
    function getTimeAgo(date: Date): string {
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return '1 day ago';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      
      const diffInWeeks = Math.floor(diffInDays / 7);
      if (diffInWeeks === 1) return '1 week ago';
      return `${diffInWeeks} weeks ago`;
    }

  } catch (error) {
    console.error('Dashboard API error:', error);
    logger.error('dashboard_api_error', { error: error instanceof Error ? error.message : String(error) });
    
    return Response.json({
      userName: 'there',
      showOnboarding: true,
      hasEmailIntegration: false,
      hasCalendarIntegration: false,
      
      // Metrics for dashboard cards
      activeLeads: 0,
      leadsChange: 0,
      totalContacts: 0,
      contactsChange: 0,
      unreadEmails: 0,
      upcomingTasks: 0,
      
      // Activity data
      recentActivities: [],
      upcomingTasks: [],
      
      // Calendar data
      recentThreads: [],
      upcomingEvents: [],
      calendarStats: { todayCount: 0, upcomingCount: 0 },
      
      // Additional stats
      totalTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      recentContacts: [],
      
      // Legacy fields
      pipelineStats: [],
      totalActiveLeads: 0,
      tokenHealth: []
    }, { status: 500 });
  }
}
