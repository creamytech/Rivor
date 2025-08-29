import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        image: true,
        email: true,
        personalityOnboarded: true,
        orgMembers: {
          select: {
            org: {
              select: {
                id: true
              }
            }
          }
        },
        emailAccounts: {
          select: {
            signatureStyle: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check required fields for profile completion
    const missingFields: string[] = [];
    let totalFields = 0;
    let completedFields = 0;

    // Required: Full name
    totalFields++;
    if (!user.name || user.name.trim().length === 0) {
      missingFields.push('name');
    } else {
      completedFields++;
    }

    // Required: Profile picture
    totalFields++;
    if (!user.image) {
      missingFields.push('image');
    } else {
      completedFields++;
    }

    // Required: Email signature (check if user has any email account with signature)
    totalFields++;
    const hasEmailSignature = user.emailAccounts.some(account => 
      account.signatureStyle && account.signatureStyle.trim().length > 0
    );
    if (!hasEmailSignature) {
      missingFields.push('emailSignature');
    } else {
      completedFields++;
    }

    // Required: AI personality onboarding
    totalFields++;
    if (!user.personalityOnboarded) {
      missingFields.push('personalityOnboarding');
    } else {
      completedFields++;
    }

    const completionPercentage = Math.round((completedFields / totalFields) * 100);
    const isComplete = missingFields.length === 0;

    const response: ProfileCompletionStatus = {
      isComplete,
      missingFields,
      completionPercentage
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Profile completion check error:', error);
    return NextResponse.json(
      { error: 'Failed to check profile completion' },
      { status: 500 }
    );
  }
}