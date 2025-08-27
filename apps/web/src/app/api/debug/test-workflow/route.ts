import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { scheduledSyncService } from '@/server/scheduled-sync-service';
import { emailWorkflowService } from '@/server/email-workflow';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Test complete automated workflow
 * This endpoint tests the entire email AI workflow end-to-end
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ 
        error: 'No organization found' 
      }, { status: 400 });
    }

    const { testType = 'full' } = await request.json().catch(() => ({}));
    
    const testResults: any = {
      testType,
      timestamp: new Date().toISOString(),
      orgId,
      userEmail: session.user.email,
      tests: {}
    };

    // Test 1: Check AI Analysis Service
    console.log('🧪 Testing AI Analysis Service...');
    try {
      // Find a real email message to test with
      const testMessage = await prisma.emailMessage.findFirst({
        where: { 
          orgId,
          AND: [
            { subjectEnc: { not: null } },
            { bodyRefEnc: { not: null } }
          ]
        },
        orderBy: { sentAt: 'desc' },
        take: 1
      });

      if (testMessage) {
        // Test AI analysis on real message
        const analysisResult = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/inbox/ai-analysis`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify({ emailId: testMessage.id })
        });

        testResults.tests.aiAnalysis = {
          success: analysisResult.ok,
          status: analysisResult.status,
          messageId: testMessage.id,
          result: analysisResult.ok ? await analysisResult.json() : await analysisResult.text()
        };
      } else {
        testResults.tests.aiAnalysis = {
          success: false,
          error: 'No test messages found'
        };
      }
    } catch (error) {
      testResults.tests.aiAnalysis = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test 2: Check Email Workflow Service  
    console.log('🧪 Testing Email Workflow Service...');
    try {
      // Find a thread to test workflow processing
      const testThread = await prisma.emailThread.findFirst({
        where: { 
          orgId,
          OR: [
            { status: { not: 'processed' } },
            { status: null }
          ]
        },
        include: {
          messages: {
            take: 1,
            orderBy: { sentAt: 'desc' }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 1
      });

      if (testThread && testThread.messages.length > 0) {
        const workflowResult = await emailWorkflowService.processEmailThread(
          orgId,
          testThread.id
        );

        testResults.tests.emailWorkflow = {
          success: workflowResult.processed,
          threadId: testThread.id,
          messageId: workflowResult.messageId,
          leadDetected: workflowResult.leadDetected,
          leadId: workflowResult.leadId,
          aiAnalysis: workflowResult.aiAnalysis,
          result: workflowResult
        };
      } else {
        testResults.tests.emailWorkflow = {
          success: false,
          error: 'No test threads found for workflow processing'
        };
      }
    } catch (error) {
      testResults.tests.emailWorkflow = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test 3: Check Auto-Sync Service
    console.log('🧪 Testing Auto-Sync Service...');
    try {
      const autoSyncResult = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sync/auto`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || ''
        }
      });

      testResults.tests.autoSync = {
        success: autoSyncResult.ok,
        status: autoSyncResult.status,
        result: autoSyncResult.ok ? await autoSyncResult.json() : await autoSyncResult.text()
      };
    } catch (error) {
      testResults.tests.autoSync = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test 4: Check Scheduled Sync Service
    console.log('🧪 Testing Scheduled Sync Service...');
    try {
      const syncStatus = await scheduledSyncService.getSyncStatus(orgId);
      
      testResults.tests.scheduledSync = {
        success: true,
        status: syncStatus,
        isScheduled: syncStatus.scheduled,
        lastSync: syncStatus.lastSync,
        nextSync: syncStatus.nextSync,
        activeSyncs: syncStatus.activeSyncs
      };

      // Test starting/stopping scheduled sync
      if (!syncStatus.scheduled) {
        await scheduledSyncService.startOrgSync(orgId);
        testResults.tests.scheduledSync.started = true;
      }
    } catch (error) {
      testResults.tests.scheduledSync = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test 5: Check Database State
    console.log('🧪 Testing Database State...');
    try {
      const [
        emailAccountCount,
        threadCount, 
        messageCount,
        aiAnalysisCount,
        notificationCount,
        leadCount
      ] = await Promise.all([
        prisma.emailAccount.count({ where: { orgId } }),
        prisma.emailThread.count({ where: { orgId } }),
        prisma.emailMessage.count({ where: { orgId } }),
        prisma.emailAIAnalysis.count({
          where: { 
            emailMessage: { orgId }
          }
        }),
        prisma.notification.count({ where: { orgId } }),
        prisma.lead.count({ where: { orgId } })
      ]);

      testResults.tests.databaseState = {
        success: true,
        counts: {
          emailAccounts: emailAccountCount,
          threads: threadCount,
          messages: messageCount,
          aiAnalyses: aiAnalysisCount,
          notifications: notificationCount,
          leads: leadCount
        },
        hasData: emailAccountCount > 0 && threadCount > 0
      };
    } catch (error) {
      testResults.tests.databaseState = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test 6: Check Notification System
    console.log('🧪 Testing Notification System...');
    try {
      // Get recent notifications
      const recentNotifications = await prisma.notification.findMany({
        where: { 
          orgId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      testResults.tests.notifications = {
        success: true,
        recentCount: recentNotifications.length,
        types: recentNotifications.reduce((acc: any, notif) => {
          acc[notif.type] = (acc[notif.type] || 0) + 1;
          return acc;
        }, {}),
        latest: recentNotifications[0] || null
      };
    } catch (error) {
      testResults.tests.notifications = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Calculate overall success
    const successfulTests = Object.values(testResults.tests).filter((test: any) => test.success).length;
    const totalTests = Object.keys(testResults.tests).length;
    
    testResults.summary = {
      totalTests,
      successfulTests,
      failedTests: totalTests - successfulTests,
      successRate: Math.round((successfulTests / totalTests) * 100),
      overallSuccess: successfulTests === totalTests,
      recommendations: []
    };

    // Add recommendations based on test results
    if (!testResults.tests.aiAnalysis?.success) {
      testResults.summary.recommendations.push('Check OpenAI API key configuration and email decryption');
    }
    if (!testResults.tests.emailWorkflow?.success) {
      testResults.summary.recommendations.push('Verify email workflow service and lead detection configuration');
    }
    if (!testResults.tests.autoSync?.success) {
      testResults.summary.recommendations.push('Check email account connections and sync permissions');
    }
    if (!testResults.tests.scheduledSync?.success || !testResults.tests.scheduledSync?.isScheduled) {
      testResults.summary.recommendations.push('Enable scheduled sync service for automatic processing');
    }
    if (!testResults.tests.databaseState?.hasData) {
      testResults.summary.recommendations.push('Ensure email accounts are connected and syncing data');
    }

    logger.info('Workflow test completed', {
      orgId,
      successRate: testResults.summary.successRate,
      overallSuccess: testResults.summary.overallSuccess,
      action: 'workflow_test_complete'
    });

    return NextResponse.json(testResults, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Workflow test failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json({
      success: false,
      error: 'Workflow test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check workflow health
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ 
        error: 'No organization found' 
      }, { status: 400 });
    }

    // Quick health check
    const healthCheck = {
      timestamp: new Date().toISOString(),
      orgId,
      services: {
        database: false,
        emailAccounts: false,
        scheduledSync: false,
        aiAnalysis: false
      },
      overallHealth: 'unknown'
    };

    try {
      // Check database connectivity
      await prisma.$queryRaw`SELECT 1`;
      healthCheck.services.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    try {
      // Check email accounts
      const emailAccountCount = await prisma.emailAccount.count({ 
        where: { orgId, status: 'connected' } 
      });
      healthCheck.services.emailAccounts = emailAccountCount > 0;
    } catch (error) {
      console.error('Email accounts health check failed:', error);
    }

    try {
      // Check scheduled sync
      const syncStatus = await scheduledSyncService.getSyncStatus(orgId);
      healthCheck.services.scheduledSync = syncStatus.scheduled;
    } catch (error) {
      console.error('Scheduled sync health check failed:', error);
    }

    try {
      // Check AI analysis (check if OpenAI key is configured)
      healthCheck.services.aiAnalysis = !!process.env.OPENAI_API_KEY;
    } catch (error) {
      console.error('AI analysis health check failed:', error);
    }

    // Determine overall health
    const serviceCount = Object.keys(healthCheck.services).length;
    const healthyServices = Object.values(healthCheck.services).filter(Boolean).length;
    
    if (healthyServices === serviceCount) {
      healthCheck.overallHealth = 'healthy';
    } else if (healthyServices >= serviceCount * 0.75) {
      healthCheck.overallHealth = 'mostly_healthy';
    } else if (healthyServices >= serviceCount * 0.5) {
      healthCheck.overallHealth = 'needs_attention';
    } else {
      healthCheck.overallHealth = 'unhealthy';
    }

    return NextResponse.json(healthCheck);

  } catch (error) {
    return NextResponse.json({
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}