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

    // For now, return the first organization the user is a member of
    // In a real implementation, you might want to handle multiple organizations
    const org = user.orgMembers[0].org;

    return Response.json({
      id: org.id,
      name: org.name,
      slug: org.slug,
      brandName: org.brandName,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt
    });
  } catch (error) {
    console.error('Failed to fetch organization:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, brandName } = body;

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

    // Update organization
    const updatedOrg = await prisma.org.update({
      where: { id: org.id },
      data: {
        name: name || undefined,
        slug: slug || undefined,
        brandName: brandName || undefined
      }
    });

    return Response.json(updatedOrg);
  } catch (error) {
    console.error('Failed to update organization:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

