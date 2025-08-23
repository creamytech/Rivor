import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

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

    // Calculate real pipeline statistics
    const [
      totalDeals,
      activeLeads,
      closedDeals,
      totalTasks,
      completedTasks
    ] = await Promise.all([
      prisma.lead.count({ where: { orgId: org.id } }),
      prisma.lead.count({ where: { orgId: org.id, status: 'active' } }),
      prisma.lead.count({ where: { orgId: org.id, status: 'closed' } }),
      prisma.task.count({ where: { orgId: org.id } }),
      prisma.task.count({ where: { orgId: org.id, status: 'completed' } })
    ]);

    // Get total deal value (would need to decrypt deal values in real implementation)
    const leads = await prisma.lead.findMany({
      where: { orgId: org.id, propertyValue: { not: null } },
      select: { propertyValue: true }
    });

    const totalValue = leads.reduce((sum, lead) => sum + (lead.propertyValue || 0), 0);
    const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;
    const conversionRate = totalDeals > 0 ? (closedDeals / totalDeals) * 100 : 0;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const stats = {
      totalDeals,
      activeLeads,
      closedDeals,
      totalValue,
      averageDealSize: Math.round(averageDealSize),
      conversionRate: Math.round(conversionRate * 100) / 100,
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
      hotLeads: await prisma.lead.count({ 
        where: { 
          orgId: org.id, 
          status: 'active',
          priority: 'high'
        }
      })
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch pipeline stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline stats' },
      { status: 500 }
    );
  }
}