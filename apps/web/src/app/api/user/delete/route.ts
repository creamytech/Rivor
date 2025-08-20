import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function DELETE(request: NextRequest) {
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

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Check if user is the owner of any organizations
    const ownedOrgs = user.orgMembers.filter(member => 
      member.org.ownerUserId === user.id
    );

    if (ownedOrgs.length > 0) {
      return new Response(
        'Cannot delete account: You are the owner of one or more organizations. Please transfer ownership or delete the organizations first.',
        { status: 400 }
      );
    }

    // Delete user and all associated data
    // This will cascade delete sessions, accounts, etc. due to Prisma relations
    await prisma.user.delete({
      where: { email: session.user.email }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user account:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
