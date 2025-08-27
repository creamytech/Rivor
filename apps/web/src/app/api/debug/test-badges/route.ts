import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { analyzeEmailWithAI } from '@/server/ai-analysis-service';
import { logger } from '@/lib/logger';
import { internalFetch } from '@/lib/internal-url';

export const dynamic = 'force-dynamic';

/**
 * POST - Test badge functionality with sample data
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

    const { action = 'test_analysis' } = await request.json().catch(() => ({}));

    const testResults: any = {
      action,
      timestamp: new Date().toISOString(),
      orgId,
      tests: {}
    };

    switch (action) {
      case 'test_analysis':
        // Find an email to test AI analysis
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
          const analysisResult = await analyzeEmailWithAI(orgId, testMessage.id);
          
          testResults.tests.aiAnalysis = {
            success: !!analysisResult,
            messageId: testMessage.id,
            analysis: analysisResult
          };
        } else {
          testResults.tests.aiAnalysis = {
            success: false,
            error: 'No test messages found'
          };
        }
        break;

      case 'check_threads_api':
        // Test threads API to see if AI analysis data is included
        const threadsResponse = await internalFetch('/api/inbox/threads?limit=5', {
          headers: {
            'Cookie': request.headers.get('Cookie') || ''
          }
        });

        if (threadsResponse.ok) {
          const threadsData = await threadsResponse.json();
          const threadsWithAI = threadsData.threads?.filter((t: any) => t.aiAnalysis) || [];
          
          testResults.tests.threadsAPI = {
            success: true,
            totalThreads: threadsData.threads?.length || 0,
            threadsWithAI: threadsWithAI.length,
            sampleThread: threadsWithAI[0] || null,
            aiAnalysisFields: threadsWithAI.length > 0 ? Object.keys(threadsWithAI[0].aiAnalysis || {}) : []
          };
        } else {
          testResults.tests.threadsAPI = {
            success: false,
            status: threadsResponse.status,
            error: await threadsResponse.text()
          };
        }
        break;

      case 'test_badge_updates':
        // Test updating badges via actions API
        const testThread = await prisma.emailThread.findFirst({
          where: { orgId },
          include: {
            messages: {
              take: 1,
              orderBy: { sentAt: 'desc' }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: 1
        });

        if (testThread) {
          // Test priority update
          const priorityResponse = await internalFetch(`/api/inbox/threads/${testThread.id}/actions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('Cookie') || ''
            },
            body: JSON.stringify({
              action: 'update_priority',
              data: { priority: 'high' }
            })
          });

          const priorityResult = priorityResponse.ok ? await priorityResponse.json() : { error: await priorityResponse.text() };

          // Test category update
          const categoryResponse = await internalFetch(`/api/inbox/threads/${testThread.id}/actions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('Cookie') || ''
            },
            body: JSON.stringify({
              action: 'update_category',
              data: { category: 'hot_lead' }
            })
          });

          const categoryResult = categoryResponse.ok ? await categoryResponse.json() : { error: await categoryResponse.text() };

          testResults.tests.badgeUpdates = {
            threadId: testThread.id,
            priority: {
              success: priorityResponse.ok,
              result: priorityResult
            },
            category: {
              success: categoryResponse.ok,
              result: categoryResult
            }
          };
        } else {
          testResults.tests.badgeUpdates = {
            success: false,
            error: 'No test threads found'
          };
        }
        break;

      case 'test_pipeline':
        // Test add to pipeline functionality
        const pipelineThread = await prisma.emailThread.findFirst({
          where: { 
            orgId,
            leadId: null // Only test with threads not already in pipeline
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

        if (pipelineThread) {
          const pipelineResponse = await internalFetch(`/api/inbox/threads/${pipelineThread.id}/actions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('Cookie') || ''
            },
            body: JSON.stringify({
              action: 'add_to_pipeline',
              data: {
                contactName: 'Test Contact',
                contactEmail: 'test@example.com',
                contactPhone: '555-0123',
                propertyAddress: '123 Test St',
                propertyType: 'Single Family Home',
                budget: '$400,000',
                timeline: '3 months',
                notes: 'Test pipeline entry from badge testing'
              }
            })
          });

          const pipelineResult = pipelineResponse.ok ? await pipelineResponse.json() : { error: await pipelineResponse.text() };

          testResults.tests.pipeline = {
            success: pipelineResponse.ok,
            status: pipelineResponse.status,
            threadId: pipelineThread.id,
            result: pipelineResult
          };
        } else {
          testResults.tests.pipeline = {
            success: false,
            error: 'No available threads for pipeline testing'
          };
        }
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use: test_analysis, check_threads_api, test_badge_updates, test_pipeline' 
        }, { status: 400 });
    }

    // Calculate overall success
    const tests = Object.values(testResults.tests);
    const successfulTests = tests.filter((test: any) => test.success).length;
    
    testResults.summary = {
      totalTests: tests.length,
      successfulTests,
      failedTests: tests.length - successfulTests,
      overallSuccess: successfulTests === tests.length
    };

    logger.info('Badge functionality test completed', {
      orgId,
      action,
      summary: testResults.summary
    });

    return NextResponse.json(testResults);

  } catch (error) {
    logger.error('Badge test failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      error: 'Badge test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET - Quick badge status check
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

    // Quick stats
    const [
      totalThreads,
      threadsWithAI,
      threadsWithLeads,
      recentAnalyses
    ] = await Promise.all([
      prisma.emailThread.count({ where: { orgId } }),
      prisma.emailThread.count({
        where: {
          orgId,
          messages: {
            some: {
              aiAnalysis: {
                isNot: null
              }
            }
          }
        }
      }),
      prisma.emailThread.count({
        where: {
          orgId,
          leadId: { not: null }
        }
      }),
      prisma.emailAIAnalysis.count({
        where: {
          emailMessage: { orgId },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      orgId,
      stats: {
        totalThreads,
        threadsWithAI,
        threadsWithLeads,
        recentAnalyses,
        aiCoverage: totalThreads > 0 ? Math.round((threadsWithAI / totalThreads) * 100) : 0,
        pipelineConversion: totalThreads > 0 ? Math.round((threadsWithLeads / totalThreads) * 100) : 0
      },
      badgeSystemHealth: {
        aiAnalysisWorking: threadsWithAI > 0,
        pipelineIntegrationWorking: threadsWithLeads > 0,
        recentActivity: recentAnalyses > 0
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Badge status check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}