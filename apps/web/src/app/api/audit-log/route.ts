import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        orgMembers: {
          include: {
            org: true
          }
        }
      }
    });

    if (!user || user.orgMembers.length === 0) {
      return new Response('No organization found', { status: 404 });
    }

    const org = user.orgMembers[0].org;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default: // 7d
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get audit logs from database
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        orgId: org.id,
        createdAt: {
          gte: startDate
        },
        ...(category && { category }),
        ...(search && {
          OR: [
            { action: { contains: search, mode: 'insensitive' } },
            { details: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } }
          ]
        })
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to 100 most recent entries
    });

    const formattedLogs = auditLogs.map(log => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      userId: log.userId,
      userName: log.user.name || 'Unknown User',
      userEmail: log.user.email,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      details: log.details,
      ipAddress: log.ipAddress || 'Unknown',
      userAgent: log.userAgent || 'Unknown',
      severity: log.severity,
      category: log.category
    }));

    return Response.json({ logs: formattedLogs });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
