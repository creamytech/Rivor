import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

/**
 * Get pending invitations
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

    // For now, return demo data since we don't have an invites table yet
    const demoInvites = [
      {
        id: 'demo-invite-1',
        email: 'newteam@company.com',
        role: 'member' as const,
        invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        invitedBy: 'john@company.com',
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    return NextResponse.json({ invites: demoInvites });

  } catch (error: unknown) {
    console.error('Organization invites API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

/**
 * Create new invitation
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
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if user already exists in org
    const existingMember = await prisma.orgMember.findFirst({
      where: {
        orgId,
        user: {
          email: email.toLowerCase()
        }
      }
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 409 }
      );
    }

    // For now, return success without actually creating the invite
    // In a real implementation, you would:
    // 1. Create an invitation record
    // 2. Send an email invitation
    // 3. Generate a secure invite token

    const mockInvite = {
      id: `invite-${Date.now()}`,
      email: email.toLowerCase(),
      role,
      invitedAt: new Date().toISOString(),
      invitedBy: session.user.email,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    return NextResponse.json(mockInvite);

  } catch (error: unknown) {
    console.error('Organization invite creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
