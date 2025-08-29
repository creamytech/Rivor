import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, image, personalityOnboarded } = body;

    // Update user profile
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (image !== undefined) {
      updateData.image = image;
    }
    
    if (personalityOnboarded !== undefined) {
      updateData.personalityOnboarded = personalityOnboarded;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        image: true,
        personalityOnboarded: true
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}