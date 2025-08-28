import { NextRequest, NextResponse } from 'next/server';
import { createNotification, createLeadNotification, createDraftNotification, getOrgUserId } from '@/server/notifications';
import { auth } from '@/server/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const userId = session.user.id!;
    const { type } = await req.json();

    let result;

    switch (type) {
      case 'lead':
        result = await createLeadNotification(
          orgId,
          'test-lead-id',
          'test-thread-id',
          'Interested in buying a property in downtown',
          'john@example.com',
          'buyer_lead',
          85,
          {
            category: 'buyer_lead',
            priorityScore: 85,
            leadScore: 90,
            keyEntities: {
              contacts: ['john@example.com'],
              propertyType: '2-bedroom condo'
            }
          }
        );
        break;

      case 'draft':
        const draftUserId = await getOrgUserId(orgId);
        if (draftUserId) {
          result = await createDraftNotification(
            orgId,
            draftUserId,
            'test-draft-id',
            'Property inquiry - downtown condo',
            'sarah@example.com',
            'buyer_lead'
          );
        }
        break;

      case 'email':
        result = await createNotification({
          orgId,
          userId,
          type: 'email',
          title: 'New Email Received',
          message: 'You have received a new email from potential.client@example.com',
          priority: 'medium'
        });
        break;

      case 'hot_lead':
        result = await createLeadNotification(
          orgId,
          'test-hot-lead-id',
          'test-hot-thread-id',
          'URGENT: Need to sell my house ASAP!',
          'urgent.seller@example.com',
          'hot_lead',
          95,
          {
            category: 'hot_lead',
            priorityScore: 95,
            leadScore: 98,
            keyEntities: {
              contacts: ['urgent.seller@example.com'],
              propertyType: 'Single family home'
            }
          }
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      result,
      message: `Test ${type} notification created successfully`
    });

  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { error: 'Failed to create test notification' },
      { status: 500 }
    );
  }
}