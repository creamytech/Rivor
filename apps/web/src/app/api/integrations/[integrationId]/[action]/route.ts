import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(
  request: NextRequest,
  { params }: { params: { integrationId: string; action: string } }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { integrationId, action } = params;

  if (!integrationId || !action) {
    return new Response('Missing required parameters', { status: 400 });
  }

  if (!['connect', 'reconnect', 'pause', 'resume', 'disconnect'].includes(action)) {
    return new Response('Invalid action', { status: 400 });
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

    if (!user || user.orgMembers.length === 0) {
      return new Response('No organization found', { status: 404 });
    }

    const org = user.orgMembers[0].org;

    // Find the integration (email or calendar account)
    const emailAccount = org.emailAccounts.find(acc => acc.id === integrationId);
    const calendarAccount = org.calendarAccounts.find(acc => acc.id === integrationId);

    if (!emailAccount && !calendarAccount) {
      return new Response('Integration not found', { status: 404 });
    }

    const account = emailAccount || calendarAccount;
    const accountType = emailAccount ? 'emailAccount' : 'calendarAccount';

    // Perform the action
    switch (action) {
      case 'connect':
        // In a real implementation, you'd redirect to OAuth flow
        await prisma[accountType].update({
          where: { id: integrationId },
          data: { status: 'connecting' }
        });
        break;

      case 'reconnect':
        // In a real implementation, you'd redirect to OAuth flow
        await prisma[accountType].update({
          where: { id: integrationId },
          data: { status: 'connecting' }
        });
        break;

      case 'pause':
        await prisma[accountType].update({
          where: { id: integrationId },
          data: { status: 'paused' }
        });
        break;

      case 'resume':
        await prisma[accountType].update({
          where: { id: integrationId },
          data: { status: 'connected' }
        });
        break;

      case 'disconnect':
        await prisma[accountType].update({
          where: { id: integrationId },
          data: { status: 'disconnected' }
        });
        break;

      default:
        return new Response('Invalid action', { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to perform integration action:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
