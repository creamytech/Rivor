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
