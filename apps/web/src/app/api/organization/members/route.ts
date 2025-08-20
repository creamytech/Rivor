import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
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

    // Get all members of the organization
    const members = await prisma.orgMember.findMany({
      where: { orgId: org.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const formattedMembers = members.map(member => ({
      id: member.id,
      name: member.user.name || 'Unknown User',
      email: member.user.email,
      role: member.role,
      status: 'active', // For now, assume all members are active
      joinedAt: member.createdAt.toISOString(),
      lastActiveAt: member.updatedAt.toISOString()
    }));

    return Response.json({ members: formattedMembers });
  } catch (error) {
    console.error('Failed to fetch organization members:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { memberId, action } = body;

    if (!memberId || !action) {
      return new Response('Missing required fields', { status: 400 });
    }

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
    const currentUserMember = user.orgMembers[0];

    // Check if current user has permission to perform the action
    if (currentUserMember.role !== 'owner' && currentUserMember.role !== 'admin') {
      return new Response('Insufficient permissions', { status: 403 });
    }

    // Find the member to modify
    const targetMember = await prisma.orgMember.findUnique({
      where: { id: memberId },
      include: { user: true }
    });

    if (!targetMember || targetMember.orgId !== org.id) {
      return new Response('Member not found', { status: 404 });
    }

    // Prevent self-modification for certain actions
    if (targetMember.userId === user.id && ['remove', 'suspend'].includes(action)) {
      return new Response('Cannot perform this action on yourself', { status: 400 });
    }

    // Perform the action
    switch (action) {
      case 'promote':
        if (targetMember.role === 'member') {
          await prisma.orgMember.update({
            where: { id: memberId },
            data: { role: 'admin' }
          });
        }
        break;

      case 'demote':
        if (targetMember.role === 'admin') {
          await prisma.orgMember.update({
            where: { id: memberId },
            data: { role: 'member' }
          });
        }
        break;

      case 'remove':
        await prisma.orgMember.delete({
          where: { id: memberId }
        });
        break;

      default:
        return new Response('Invalid action', { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to update organization member:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
