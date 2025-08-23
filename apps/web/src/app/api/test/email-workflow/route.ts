import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/auth';
import { emailWorkflowService } from '@/server/email-workflow';
import { leadDetectionService } from '@/server/lead-detection';
import { notificationService } from '@/server/notification-service';
import { prisma } from '@/server/db';
import { encryptForOrg } from '@/server/crypto';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        orgMembers: {
          include: { org: true }
        }
      }
    });

    const org = user?.orgMembers?.[0]?.org;
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();
    const { testType = 'complete' } = body;

    logger.info('Starting email workflow test', {
      orgId: org.id,
      userId: user?.id,
      testType,
      action: 'workflow_test_start'
    });

    const results: any = {};

    if (testType === 'complete' || testType === 'create_test_data') {
      // Create test email data
      results.testDataCreated = await createTestEmailData(org.id);
    }

    if (testType === 'complete' || testType === 'lead_detection') {
      // Test lead detection
      results.leadDetection = await testLeadDetection(org.id);
    }

    if (testType === 'complete' || testType === 'notifications') {
      // Test notifications
      results.notifications = await testNotifications(org.id);
    }

    if (testType === 'complete' || testType === 'workflow') {
      // Test complete workflow
      results.workflow = await testCompleteWorkflow(org.id);
    }

    if (testType === 'complete' || testType === 'stats') {
      // Get workflow stats
      results.stats = await emailWorkflowService.getWorkflowStats(org.id);
    }

    logger.info('Email workflow test completed', {
      orgId: org.id,
      testType,
      success: true,
      action: 'workflow_test_complete'
    });

    return NextResponse.json({
      success: true,
      message: `Email workflow test (${testType}) completed successfully`,
      results
    });

  } catch (error) {
    logger.error('Email workflow test failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      action: 'workflow_test_error'
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

async function createTestEmailData(orgId: string) {
  try {
    // Create test email account if it doesn't exist
    let emailAccount = await prisma.emailAccount.findFirst({
      where: { orgId, provider: 'google' }
    });

    if (!emailAccount) {
      emailAccount = await prisma.emailAccount.create({
        data: {
          orgId,
          provider: 'google',
          email: 'test@example.com',
          status: 'connected',
          externalAccountId: 'test-account-123'
        }
      });
    }

    // Create test email thread with potential lead content
    const testSubject = 'Interested in buying investment property - Downtown area';
    const testBody = `Hi there,

I'm very interested in purchasing an investment property in the downtown area. I have been looking at multi-family properties in the $500k-800k range and would love to discuss available options.

I'm a cash buyer with pre-approval and looking to close within 30-45 days. Please let me know what properties you have available that might be a good fit.

My contact information:
- Name: John Smith
- Email: john.smith@investor.com  
- Phone: (555) 123-4567
- Company: Smith Investment Group

Looking forward to hearing from you soon!

Best regards,
John Smith
CEO, Smith Investment Group`;

    const testFrom = 'john.smith@investor.com';
    const testTo = 'agent@rivor.com';

    // Create encrypted test thread
    const thread = await prisma.emailThread.create({
      data: {
        orgId,
        accountId: emailAccount.id,
        subjectEnc: await encryptForOrg(orgId, testSubject, 'email:subject'),
        participantsEnc: await encryptForOrg(orgId, `${testFrom}, ${testTo}`, 'email:participants'),
        unread: true,
        status: 'unprocessed'
      }
    });

    // Create test message
    const message = await prisma.emailMessage.create({
      data: {
        orgId,
        threadId: thread.id,
        messageId: `test-message-${Date.now()}`,
        sentAt: new Date(),
        subjectEnc: await encryptForOrg(orgId, testSubject, 'email:subject'),
        bodyRefEnc: await encryptForOrg(orgId, testBody, 'email:body'),
        fromEnc: await encryptForOrg(orgId, testFrom, 'email:from'),
        toEnc: await encryptForOrg(orgId, testTo, 'email:to'),
        snippetEnc: await encryptForOrg(orgId, testBody.substring(0, 200), 'email:snippet')
      }
    });

    return {
      success: true,
      emailAccountId: emailAccount.id,
      threadId: thread.id,
      messageId: message.id,
      testData: {
        subject: testSubject,
        from: testFrom,
        bodySnippet: testBody.substring(0, 100) + '...'
      }
    };

  } catch (error) {
    logger.error('Failed to create test email data', {
      orgId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

async function testLeadDetection(orgId: string) {
  try {
    // Get a test thread
    const thread = await prisma.emailThread.findFirst({
      where: { orgId, status: 'unprocessed' },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1
        }
      }
    });

    if (!thread || !thread.messages[0]) {
      return { success: false, error: 'No test thread found' };
    }

    // Test lead detection
    const leadResult = await leadDetectionService.analyzeMessageForLead(
      orgId,
      thread.messages[0].id,
      thread.id
    );

    return {
      success: true,
      threadId: thread.id,
      messageId: thread.messages[0].id,
      leadDetection: {
        isLead: leadResult.isLead,
        confidence: leadResult.confidence,
        reason: leadResult.reason,
        suggestedActions: leadResult.suggestedActions,
        extractedInfo: leadResult.extractedInfo
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function testNotifications(orgId: string) {
  try {
    // Send test notification
    await notificationService.sendNotification(orgId, {
      type: 'lead_detected',
      title: 'Test Lead Detection',
      message: 'This is a test notification from the email workflow system',
      priority: 'high',
      actionUrl: '/test/lead/123'
    });

    // Get recent notifications
    const notifications = await notificationService.getNotificationHistory(orgId, 10);

    return {
      success: true,
      testNotificationSent: true,
      recentNotifications: notifications.length,
      latestNotification: notifications[0] || null
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function testCompleteWorkflow(orgId: string) {
  try {
    // Get unprocessed threads
    const unprocessedThreads = await prisma.emailThread.findMany({
      where: { 
        orgId, 
        status: { not: 'processed' },
        leadId: null
      },
      take: 3,
      select: { id: true }
    });

    if (unprocessedThreads.length === 0) {
      return { success: false, error: 'No unprocessed threads found for testing' };
    }

    // Process threads through complete workflow
    const results = await emailWorkflowService.batchProcessEmails(
      orgId,
      unprocessedThreads.map(t => t.id)
    );

    return {
      success: true,
      batchResults: results,
      threadsProcessed: unprocessedThreads.map(t => t.id)
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        orgMembers: {
          include: { org: true }
        }
      }
    });

    const org = user?.orgMembers?.[0]?.org;
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Get test status and statistics
    const stats = await emailWorkflowService.getWorkflowStats(org.id);
    
    const testData = await prisma.emailThread.findMany({
      where: { orgId: org.id },
      include: {
        messages: { take: 1 },
        lead: { select: { id: true, title: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    const notifications = await notificationService.getNotificationHistory(org.id, 5);

    return NextResponse.json({
      success: true,
      stats,
      recentThreads: testData.map(t => ({
        id: t.id,
        hasMessages: t.messages.length > 0,
        hasLead: !!t.lead,
        leadTitle: t.lead?.title,
        status: t.status,
        updatedAt: t.updatedAt
      })),
      recentNotifications: notifications.length
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}