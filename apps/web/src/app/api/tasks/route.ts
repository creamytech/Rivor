import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';
import { mixWithDemoData, demoTasks } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

/**
 * Get tasks for the organization
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let whereClause: any = { orgId };

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

    // Mix with demo data if enabled
    const finalTasks = mixWithDemoData(tasksFormatted, demoTasks.map(task => ({
      id: task.id,
      title: task.title,
      description: '',
      status: task.completed ? 'completed' as const : 'pending' as const,
      priority: task.priority as 'low' | 'medium' | 'high',
      dueAt: task.dueAt?.toISOString(),
      completedAt: task.completed ? new Date().toISOString() : undefined,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'demo_user',
      assignedTo: undefined,
      linkedEmailId: undefined,
      linkedLeadId: undefined,
      linkedContactId: undefined,
      tags: []
    })));

    const response = {
      tasks: finalTasks,
      total: finalTasks.length
    };

    return NextResponse.json(response);

  } catch (error: any) {
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

    const orgId = (session as any).orgId;
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

  } catch (error: any) {
    console.error('Task creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
