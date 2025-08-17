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
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        timezone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    return Response.json(user);
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
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
    const { name, title, timezone, language } = body;

    // Validate input
    if (name && typeof name !== 'string') {
      return new Response('Invalid name', { status: 400 });
    }

    if (timezone && typeof timezone !== 'string') {
      return new Response('Invalid timezone', { status: 400 });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name || undefined,
        timezone: timezone || undefined,
        // Note: title and language would need to be added to the User model
        // For now, we'll store them in a separate table or as metadata
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        timezone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return Response.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
