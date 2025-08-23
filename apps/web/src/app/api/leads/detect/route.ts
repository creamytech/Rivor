import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/auth';
import { emailWorkflowService } from '@/server/email-workflow';
import { prisma } from '@/server/db';
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
    const { threadId, threadIds } = body;

    let result;

    if (threadId) {
      // Process single thread
      result = await emailWorkflowService.processEmailThread(org.id, threadId);
    } else if (threadIds && Array.isArray(threadIds)) {
      // Process multiple threads
      result = await emailWorkflowService.batchProcessEmails(org.id, threadIds);
    } else {
      // Process all unprocessed threads
      result = await emailWorkflowService.batchProcessEmails(org.id);
    }

    logger.info('Lead detection API called', {
      orgId: org.id,
      userId: user?.id,
      type: threadId ? 'single' : 'batch',
      action: 'lead_detection_api'
    });

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    logger.error('Lead detection API error', {
      error: error instanceof Error ? error.message : String(error),
      action: 'lead_detection_api_error'
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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

    // Get workflow statistics
    const stats = await emailWorkflowService.getWorkflowStats(org.id);

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Lead detection stats API error', {
      error: error instanceof Error ? error.message : String(error),
      action: 'lead_detection_stats_error'
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}