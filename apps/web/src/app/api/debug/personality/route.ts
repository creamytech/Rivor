import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { getPersonalityForOrg } from '@/server/ai/personality';
import { prisma } from '@/lib/db-pool';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get personality data
    const personality = await getPersonalityForOrg(orgId);
    
    // Also check raw database record
    const rawPersonality = await prisma.agentPersonality.findUnique({
      where: { orgId }
    });

    // Check if there are any onboarding sessions
    const onboardingSessions = await prisma.onboardingSession.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      orgId,
      hasPersonality: !!personality,
      personality,
      rawPersonality,
      onboardingSessions: onboardingSessions.map(s => ({
        id: s.id,
        status: s.status,
        currentStep: s.currentStep,
        sessionType: s.sessionType,
        completedAt: s.completedAt,
        createdAt: s.createdAt
      }))
    });

  } catch (error) {
    console.error('Debug personality error:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve personality data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}