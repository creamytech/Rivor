import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
// Removed demo data imports - now using real data only

export const dynamic = 'force-dynamic';

/**
 * Get tasks for the organization
 */
export async function GET(req: NextRequest) {
  try {
    // Development bypass - return mock data
    if (process.env.NODE_ENV === 'development') {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Follow up with Sarah Johnson',
          description: 'Send property details for the Austin downtown listing',
          status: 'pending' as const,
          priority: 'high' as const,
          dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          completedAt: null,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'john@example.com',
          assignedTo: 'john@example.com',
          linkedEmailId: null,
          linkedLeadId: 'lead-1',
          linkedContactId: 'mock-1',
          tags: ['follow-up', 'hot-lead']
        },
        {
          id: 'task-2',
          title: 'Schedule property showing',
          description: 'Coordinate viewing for Michael Chen - commercial property on Oak Ave',
          status: 'in_progress' as const,
          priority: 'medium' as const,
          dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          completedAt: null,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          createdBy: 'sarah@example.com',
          assignedTo: 'john@example.com',
          linkedEmailId: 'email-123',
          linkedLeadId: 'lead-2',
          linkedContactId: 'mock-2',
          tags: ['showing', 'commercial']
        },
        {
          id: 'task-3',
          title: 'Send market analysis report',
          description: 'Prepare and send CMA for Emma Rodriguez properties',
          status: 'completed' as const,
          priority: 'medium' as const,
          dueAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          createdBy: 'john@example.com',
          assignedTo: 'sarah@example.com',
          linkedEmailId: null,
          linkedLeadId: 'lead-3',
          linkedContactId: 'mock-3',
          tags: ['analysis', 'residential']
        },
        {
          id: 'task-4',
          title: 'Update listing photos',
          description: 'Get professional photos for luxury listing on Elm Dr',
          status: 'pending' as const,
          priority: 'low' as const,
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          completedAt: null,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'sarah@example.com',
          assignedTo: 'john@example.com',
          linkedEmailId: null,
          linkedLeadId: null,
          linkedContactId: 'mock-4',
          tags: ['listing', 'photos']
        }
      ];

      return NextResponse.json({
        tasks: mockTasks,
        total: mockTasks.length
      });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const whereClause: unknown = { orgId };

    if (status) {
      whereClause.status = status;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: [
        { status: 'asc' }, // pending first
        { dueAt: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    // Transform to UI format
    const tasksFormatted = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      priority: task.priority as 'low' | 'medium' | 'high',
      dueAt: task.dueAt?.toISOString(),
      completedAt: task.completedAt?.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      createdBy: task.createdBy || 'Unknown',
      assignedTo: task.assignedTo,
      linkedEmailId: task.linkedEmailId,
      linkedLeadId: task.linkedLeadId,
      linkedContactId: task.linkedContactId,
      tags: task.tags || []
    }));

    // Use real tasks data only - no demo data mixing
    const finalTasks = tasksFormatted;

    const response = {
      tasks: finalTasks,
      total: finalTasks.length
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Tasks API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

/**
 * Create new task
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await req.json();
    const {
      title,
      description,
      priority,
      dueAt,
      assignedTo,
      linkedEmailId,
      linkedLeadId,
      linkedContactId,
      tags
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        orgId,
        title,
        description: description || null,
        status: 'pending',
        priority: priority || 'medium',
        dueAt: dueAt ? new Date(dueAt) : null,
        createdBy: session.user.email,
        assignedTo: assignedTo || null,
        linkedEmailId: linkedEmailId || null,
        linkedLeadId: linkedLeadId || null,
        linkedContactId: linkedContactId || null,
        tags: tags || []
      }
    });

    // Transform to UI format
    const taskFormatted = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      priority: task.priority as 'low' | 'medium' | 'high',
      dueAt: task.dueAt?.toISOString(),
      completedAt: task.completedAt?.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      createdBy: task.createdBy || 'Unknown',
      assignedTo: task.assignedTo,
      linkedEmailId: task.linkedEmailId,
      linkedLeadId: task.linkedLeadId,
      linkedContactId: task.linkedContactId,
      tags: task.tags || []
    };

    return NextResponse.json(taskFormatted);

  } catch (error: unknown) {
    console.error('Task creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
