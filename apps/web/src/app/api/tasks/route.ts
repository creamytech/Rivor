import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';
import { decryptForOrg } from '@/server/crypto';

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

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const whereClause: any = { orgId: org.id };

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
      skip: offset,
      include: {
        lead: {
          select: { id: true, title: true }
        }
      }
    });

    // Transform to UI format with decrypted data
    const tasksFormatted = await Promise.all(
      tasks.map(async (task) => {
        let description = task.description || '';
        
        // Decrypt description if it's encrypted
        if (task.descriptionEnc) {
          try {
            const decryptedBytes = await decryptForOrg(org.id, task.descriptionEnc, 'task:description');
            description = new TextDecoder().decode(decryptedBytes);
          } catch (error) {
            console.warn('Failed to decrypt task description:', error);
          }
        }

        return {
          id: task.id,
          title: task.title,
          description,
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
          tags: (task.tags as string[]) || [],
          lead: task.lead ? {
            id: task.lead.id,
            title: task.lead.title
          } : null
        };
      })
    );

    const response = {
      tasks: tasksFormatted,
      total: tasksFormatted.length
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
        orgId: org.id,
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
      tags: (task.tags as string[]) || []
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