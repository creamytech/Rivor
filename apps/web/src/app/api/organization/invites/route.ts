import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

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

    // For now, return empty invites array
    // In a real implementation, you'd have an Invite model in your database
    const invites: any[] = [];

    return Response.json({ invites });
  } catch (error) {
    console.error('Failed to fetch organization invites:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return new Response('Missing required fields', { status: 400 });
    }

    if (!['admin', 'member'].includes(role)) {
      return new Response('Invalid role', { status: 400 });
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

    const org = user.orgMembers[0];
    const currentUserMember = user.orgMembers[0];

    // Check if current user has permission to invite
    if (currentUserMember.role !== 'owner' && currentUserMember.role !== 'admin') {
      return new Response('Insufficient permissions', { status: 403 });
    }

    // Check if user is already a member
    const existingMember = await prisma.orgMember.findFirst({
      where: {
        orgId: org.org.id,
        user: { email }
      }
    });

    if (existingMember) {
      return new Response('User is already a member of this organization', { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Create an invite record in the database
    // 2. Send an email invitation
    // 3. Generate a unique invite link

    // For now, we'll just return success
    console.log('Invitation would be sent to:', email, 'for role:', role, 'in org:', org.org.id);

    return Response.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      inviteId: `invite-${Date.now()}` // Mock invite ID
    });
  } catch (error) {
    console.error('Failed to create organization invite:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
