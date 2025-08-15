import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

/**
 * Get organization details
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

    const org = await prisma.org.findFirst({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const response = {
      id: org.id,
      name: org.name,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
      memberCount: org._count.members
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Organization API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

/**
 * Update organization details
 */
export async function PATCH(req: NextRequest) {
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
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    const updatedOrg = await prisma.org.update({
      where: { id: orgId },
      data: {
        name: name.trim(),
        updatedAt: new Date()
      }
    });

    const response = {
      id: updatedOrg.id,
      name: updatedOrg.name,
      createdAt: updatedOrg.createdAt.toISOString(),
      updatedAt: updatedOrg.updatedAt.toISOString()
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Organization update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}
