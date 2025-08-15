import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

/**
 * Get organization members
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as unknown).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const members = await prisma.orgMember.findMany({
      where: { orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            lastActiveAt: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // owner first
        { createdAt: 'asc' }
      ]
    });

    const membersFormatted = members.map(member => ({
      id: member.id,
      name: member.user.name || member.user.email,
      email: member.user.email,
      role: member.role as 'owner' | 'admin' | 'member',
      status: member.status as 'active' | 'pending' | 'suspended',
      joinedAt: member.createdAt.toISOString(),
      lastActiveAt: member.user.lastActiveAt?.toISOString()
    }));

    // Add demo members if list is empty
    if (membersFormatted.length === 0) {
      const demoMembers = [
        {
          id: 'demo-member-1',
          name: 'John Smith',
          email: 'john@company.com',
          role: 'owner' as const,
          status: 'active' as const,
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastActiveAt: new Date().toISOString()
        },
        {
          id: 'demo-member-2',
          name: 'Sarah Johnson',
          email: 'sarah@company.com',
          role: 'admin' as const,
          status: 'active' as const,
          joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      return NextResponse.json({ members: demoMembers });
    }

    return NextResponse.json({ members: membersFormatted });

  } catch (error: unknown) {
    console.error('Organization members API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization members' },
      { status: 500 }
    );
  }
}
