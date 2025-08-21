import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Update task
 */
export async function PATCH(req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { taskId } = params;
    const body = await req.json();

    // Handle mock/demo tasks (for development)
    if (taskId.startsWith('demo-') || taskId.startsWith('task-')) {
      return NextResponse.json({ success: true });
    }

    // Verify task exists and belongs to org
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, orgId }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updateData: unknown = { updatedAt: new Date() };

    // Handle specific updates
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.dueAt !== undefined) updateData.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    if (body.completedAt !== undefined) updateData.completedAt = body.completedAt ? new Date(body.completedAt) : null;
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
    if (body.tags !== undefined) updateData.tags = body.tags;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData
    });

    return NextResponse.json({ success: true, task: updatedTask });

  } catch (error: unknown) {
    console.error('Task update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

/**
 * Delete task
 */
export async function DELETE(req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { taskId } = params;

    // Handle mock/demo tasks (for development)
    if (taskId.startsWith('demo-') || taskId.startsWith('task-')) {
      return NextResponse.json({ success: true });
    }

    // Verify task exists and belongs to org
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, orgId }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Hard delete task
    await prisma.task.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Task deletion API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
