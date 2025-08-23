import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  order: number;
}

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
            org: {
              include: {
                emailAccounts: true,
                calendarAccounts: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    const org = user.orgMembers[0]?.org;

    // Define onboarding steps
    const steps: OnboardingStep[] = [
      {
        id: 'profile_setup',
        title: 'Complete Your Profile',
        description: 'Add your name, phone number, and company information',
        completed: !!(user.name && user.name.trim() !== ''),
        required: true,
        order: 1
      },
      {
        id: 'email_integration',
        title: 'Connect Your Email',
        description: 'Integrate Gmail to start managing your email communications',
        completed: org ? org.emailAccounts.length > 0 : false,
        required: true,
        order: 2
      },
      {
        id: 'calendar_integration',
        title: 'Connect Your Calendar',
        description: 'Sync your Google Calendar to manage appointments and events',
        completed: org ? org.calendarAccounts.length > 0 : false,
        required: false,
        order: 3
      },
      {
        id: 'ai_chat',
        title: 'Meet Your AI Assistant',
        description: 'Chat with our AI to personalize your experience and learn your communication style',
        completed: false, // Will be marked complete after AI chat session
        required: true,
        order: 4
      },
      {
        id: 'first_lead',
        title: 'Create Your First Lead',
        description: 'Add a contact and create your first lead to get started',
        completed: org ? await prisma.lead.count({ where: { orgId: org.id } }) > 0 : false,
        required: false,
        order: 5
      }
    ];

    // Calculate progress
    const completedSteps = steps.filter(step => step.completed).length;
    const totalSteps = steps.length;
    const requiredSteps = steps.filter(step => step.required);
    const completedRequiredSteps = requiredSteps.filter(step => step.completed).length;
    
    const progress = Math.round((completedSteps / totalSteps) * 100);
    const isComplete = completedRequiredSteps === requiredSteps.length;

    return Response.json({
      steps,
      progress,
      completedSteps,
      totalSteps,
      isComplete,
      isFirstTime: progress < 25 // Consider user new if less than 25% complete
    });

  } catch (error) {
    console.error('Failed to fetch onboarding status:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { stepId, completed } = await request.json();

    if (!stepId || typeof completed !== 'boolean') {
      return new Response('Invalid request body', { status: 400 });
    }

    // For now, we'll track completion in a simple way
    // In a real app, you might have a separate onboarding_progress table
    
    if (stepId === 'ai_chat' && completed) {
      // Mark AI chat as completed - you might store this in user metadata
      // For this demo, we'll use a simple approach
      console.log(`AI chat completed for user: ${session.user.email}`);
    }

    // Return updated status
    const updatedStatus = await fetch(`${process.env.NEXTAUTH_URL}/api/user/onboarding`);
    const statusData = await updatedStatus.json();

    return Response.json({
      success: true,
      message: `Step ${stepId} marked as ${completed ? 'completed' : 'incomplete'}`,
      ...statusData
    });

  } catch (error) {
    console.error('Failed to update onboarding step:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}