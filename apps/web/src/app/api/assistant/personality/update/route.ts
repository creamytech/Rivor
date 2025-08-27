import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedPersonality = await request.json();

    // Update the personality record
    const updated = await prisma.agentPersonality.update({
      where: { orgId: session.user.orgId },
      data: {
        communicationStyle: updatedPersonality.communicationStyle,
        tonePreferences: updatedPersonality.tonePreferences,
        vocabularyPreferences: updatedPersonality.vocabularyPreferences,
        writingPatterns: updatedPersonality.writingPatterns,
        personalBrand: updatedPersonality.personalBrand,
        signatureStyle: updatedPersonality.signatureStyle
      }
    });

    // Create a training record for manual updates
    await prisma.aIPersonalityTraining.create({
      data: {
        orgId: session.user.orgId,
        trainingType: 'manual_update',
        inputData: JSON.stringify(updatedPersonality),
        extractedPatterns: JSON.stringify({
          manualUpdate: true,
          updatedFields: Object.keys(updatedPersonality)
        }),
        confidence: 100, // Manual updates are 100% confident
        validatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      personality: updated
    });

  } catch (error) {
    console.error('Error updating personality:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}