import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { GoogleCalendarService } from '@/server/calendar';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Please sign in to test calendar functionality'
      }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ 
        error: 'No organization found',
        message: 'User session missing organization ID'
      }, { status: 400 });
    }

    logger.info('Calendar API test initiated', {
      userEmail: session.user.email,
      orgId,
      action: 'calendar_test_start'
    });

    // Step 1: Check for existing calendar account
    let calendarAccount = await prisma.calendarAccount.findFirst({
      where: {
        orgId,
        provider: 'google'
      }
    });

    const testResults = {
      session: {
        authenticated: true,
        userEmail: session.user.email,
        orgId: orgId
      },
      calendarAccount: {
        exists: !!calendarAccount,
        status: calendarAccount?.status || 'not_found',
        lastSynced: calendarAccount?.lastSyncedAt?.toISOString() || null
      },
      tokenCheck: {
        hasGoogleAccount: false,
        hasAccessToken: false,
        hasRefreshToken: false,
        scopesValid: false
      },
      calendarService: {
        canCreate: false,
        error: null
      },
      recommendation: ''
    };

    // Step 2: Check for OAuth tokens
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        orgId,
        provider: 'google'
      },
      include: {
        user: {
          include: {
            accounts: {
              where: {
                provider: 'google'
              }
            }
          }
        }
      }
    });

    if (emailAccount?.user?.accounts?.length > 0) {
      const googleAccount = emailAccount.user.accounts[0];
      testResults.tokenCheck.hasGoogleAccount = true;
      testResults.tokenCheck.hasAccessToken = !!googleAccount.access_token_enc;
      testResults.tokenCheck.hasRefreshToken = !!googleAccount.refresh_token_enc;
      
      // Check if scopes include calendar permissions
      const scopes = googleAccount.scope || '';
      testResults.tokenCheck.scopesValid = scopes.includes('calendar');
    }

    // Step 3: Auto-create calendar account if missing but have Google auth
    if (!calendarAccount && emailAccount?.externalAccountId) {
      try {
        calendarAccount = await prisma.calendarAccount.create({
          data: {
            orgId,
            provider: 'google',
            status: 'connected'
          }
        });
        testResults.calendarAccount.exists = true;
        testResults.calendarAccount.status = 'connected';
        
        logger.info('Auto-created calendar account for test', {
          orgId,
          calendarAccountId: calendarAccount.id
        });
      } catch (error) {
        testResults.calendarService.error = `Failed to create calendar account: ${error.message}`;
      }
    }

    // Step 4: Test GoogleCalendarService creation
    if (calendarAccount && testResults.tokenCheck.hasAccessToken) {
      try {
        const calendarService = await GoogleCalendarService.createFromAccount(orgId, calendarAccount.id);
        testResults.calendarService.canCreate = true;
        
        // Test getting the calendar client
        const calendar = await calendarService.getCalendar();
        
        logger.info('Calendar service test successful', {
          orgId,
          calendarAccountId: calendarAccount.id,
          action: 'calendar_service_test_success'
        });
        
      } catch (error) {
        testResults.calendarService.error = error.message;
        logger.error('Calendar service test failed', {
          orgId,
          calendarAccountId: calendarAccount.id,
          error: error.message,
          action: 'calendar_service_test_failed'
        });
      }
    }

    // Step 5: Generate recommendations
    if (!testResults.tokenCheck.hasGoogleAccount) {
      testResults.recommendation = 'Please sign in with Google OAuth to enable calendar access';
    } else if (!testResults.tokenCheck.scopesValid) {
      testResults.recommendation = 'Google account lacks calendar permissions. Please re-authorize with calendar scope';
    } else if (!testResults.tokenCheck.hasAccessToken) {
      testResults.recommendation = 'Access token missing or expired. Please re-authenticate';
    } else if (!testResults.calendarService.canCreate) {
      testResults.recommendation = `Calendar service creation failed: ${testResults.calendarService.error}`;
    } else {
      testResults.recommendation = 'Calendar API is ready! You can now sync events and create calendar entries.';
    }

    return NextResponse.json({
      success: testResults.calendarService.canCreate,
      message: 'Calendar API test completed',
      results: testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Calendar test API error', {
      error: error instanceof Error ? error.message : String(error),
      action: 'calendar_test_error'
    });

    return NextResponse.json({
      success: false,
      error: 'Calendar test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

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

    // Test creating a sample calendar event
    const calendarAccount = await prisma.calendarAccount.findFirst({
      where: {
        orgId,
        provider: 'google'
      }
    });

    if (!calendarAccount) {
      return NextResponse.json({ 
        error: 'No calendar account found',
        message: 'Run GET /api/debug/calendar-test first'
      }, { status: 404 });
    }

    const calendarService = await GoogleCalendarService.createFromAccount(orgId, calendarAccount.id);

    // Create a test event 30 minutes from now
    const now = new Date();
    const startTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const testEvent = await calendarService.createEvent({
      title: 'Rivor Calendar API Test Event',
      description: 'This is a test event created by the Rivor Calendar API integration',
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      location: 'Virtual',
      attendees: [],
      isAllDay: false
    });

    logger.info('Test calendar event created', {
      orgId,
      calendarAccountId: calendarAccount.id,
      eventId: testEvent.id,
      action: 'test_event_created'
    });

    return NextResponse.json({
      success: true,
      message: 'Test calendar event created successfully',
      event: {
        id: testEvent.id,
        title: testEvent.summary,
        start: testEvent.start,
        end: testEvent.end,
        htmlLink: testEvent.htmlLink
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Test event creation failed', {
      error: error instanceof Error ? error.message : String(error),
      action: 'test_event_creation_failed'
    });

    return NextResponse.json({
      success: false,
      error: 'Test event creation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}