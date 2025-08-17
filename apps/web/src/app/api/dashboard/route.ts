import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/server/db';
import { decryptForOrg } from '@/server/crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    const userName = session.user?.name || session.user?.email?.split('@')[0] || 'there';
    const userEmail = session.user?.email;

    // Log dashboard access
    logger.userAction('dashboard_access', userEmail || 'unknown', orgId || 'unknown');

    console.log('=== DASHBOARD DEBUG START ===');
    console.log('orgId:', orgId);
    console.log('userEmail:', userEmail);

    // Fetch real email data
    let unreadCount = 0;
    let recentThreads: any[] = [];
    
    if (orgId) {
      try {
        console.log('Fetching email data for orgId:', orgId);
        
        // Get unread count
        unreadCount = await prisma.emailMessage.count({
          where: {
            orgId
          }
        });
        console.log('Unread count:', unreadCount);

        // Check total threads first
        const totalThreads = await prisma.emailThread.count({
          where: { orgId }
        });
        console.log('Total threads in database:', totalThreads);

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
        console.log('Found threads:', threads.length);
        console.log('First thread sample:', threads[0] ? {
          id: threads[0].id,
          subjectEnc: !!threads[0].subjectEnc,
          participantsEnc: !!threads[0].participantsEnc,
          updatedAt: threads[0].updatedAt,
          messageCount: threads[0]._count.messages
        } : 'No threads');

        // Decrypt thread data for display
        recentThreads = await Promise.all(threads.map(async (thread) => {
          try {
            const subject = thread.subjectEnc ? await decryptForOrg(orgId, thread.subjectEnc, 'email:subject') : 'No Subject';
            const participants = thread.participantsEnc ? await decryptForOrg(orgId, thread.participantsEnc, 'email:participants') : 'No Participants';
            
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
        console.log('Processed threads:', recentThreads.length);
      } catch (error) {
        console.error('Failed to fetch email data:', error);
        unreadCount = 0;
        recentThreads = [];
      }
    } else {
      console.log('No orgId found for user:', userEmail);
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
        console.log('Total calendar events in database:', totalEvents);

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

        // Get actual upcoming events for display
        const events = await prisma.calendarEvent.findMany({
          where: {
            orgId,
            start: {
              gte: now
            }
          },
          orderBy: { start: 'asc' },
          take: 10
        });

        console.log('Found upcoming events:', events.length);
        console.log('First event sample:', events[0] ? {
          id: events[0].id,
          titleEnc: !!events[0].titleEnc,
          locationEnc: !!events[0].locationEnc,
          start: events[0].start,
          end: events[0].end
        } : 'No events');

        // Decrypt event data
        upcomingEvents = await Promise.all(events.map(async (event) => {
          try {
            const title = event.titleEnc ? await decryptForOrg(orgId, event.titleEnc, 'calendar:title') : 'Untitled Event';
            const location = event.locationEnc ? await decryptForOrg(orgId, event.locationEnc, 'calendar:location') : null;
            
            return {
              id: event.id,
              title: title || 'Untitled Event',
              start: event.start,
              end: event.end,
              location: location
            };
          } catch (error) {
            console.error('Failed to decrypt event data:', error);
            return {
              id: event.id,
              title: 'Untitled Event',
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

        console.log('Calendar stats:', calendarStats);
        console.log('Upcoming events:', upcomingEvents.length);
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
        
        console.log('Connected email accounts:', emailAccounts);
        console.log('Connected calendar accounts:', calendarAccounts);
      } catch (error) {
        console.error('Failed to check accounts:', error);
      }
    }

    console.log('=== DASHBOARD DEBUG END ===');

    // Return data with real information
    return Response.json({
      userName,
      showOnboarding: !hasEmailAccounts && !hasCalendarAccounts,
      hasEmailIntegration: hasEmailAccounts,
      hasCalendarIntegration: hasCalendarAccounts,
      unreadCount,
      recentThreads,
      upcomingEvents,
      calendarStats,
      pipelineStats: [],
      totalActiveLeads: 0,
      tokenHealth: []
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    logger.error('dashboard_api_error', { error: error instanceof Error ? error.message : String(error) });
    
    return Response.json({
      userName: 'there',
      showOnboarding: true,
      hasEmailIntegration: false,
      hasCalendarIntegration: false,
      unreadCount: 0,
      recentThreads: [],
      upcomingEvents: [],
      calendarStats: { todayCount: 0, upcomingCount: 0 },
      pipelineStats: [],
      totalActiveLeads: 0,
      tokenHealth: []
    }, { status: 500 });
  }
}
