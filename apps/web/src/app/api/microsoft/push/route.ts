import { NextRequest } from 'next/server';
import { enqueueEmailSync } from '@/server/queue';
import { prisma } from '@/server/db';
import { MicrosoftGraphService } from '@/server/microsoft-graph';

// Force dynamic rendering - this route uses request URL/query params
export const dynamic = 'force-dynamic';

// Microsoft Graph validation: when creating a subscription, Graph sends a GET with validationToken.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('validationToken');
  if (token) {
    return new Response(token, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return new Response('OK');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as any;
    const notifications = body?.value ?? [];
    
    for (const notification of notifications) {
      try {
        const { clientState, resource, changeType } = notification;
        
        // clientState should contain our emailAccountId
        const emailAccountId = clientState || notification.clientState?.emailAccountId;
        if (!emailAccountId) {
          console.warn('[api/microsoft/push] No clientState in notification');
          continue;
        }

        // Find the email account
        const emailAccount = await prisma.emailAccount.findUnique({
          where: { id: emailAccountId }
        });

        if (!emailAccount) {
          console.warn(`[api/microsoft/push] Account not found: ${emailAccountId}`);
          continue;
        }

        // Handle the notification based on change type
        if (changeType === 'created' || changeType === 'updated') {
          try {
            const graphService = await MicrosoftGraphService.createFromAccount(
              emailAccount.orgId, 
              emailAccountId
            );
            await graphService.handleWebhook(emailAccount.orgId, emailAccountId, notification);
          } catch (error) {
            console.error('[api/microsoft/push] Real-time sync failed, falling back to queued sync:', error);
            await enqueueEmailSync(emailAccount.orgId, emailAccountId);
          }
        }

      } catch (notificationError) {
        console.error('[api/microsoft/push] Error processing notification:', notificationError);
      }
    }
    
    return new Response('OK');
  } catch (err) {
    console.warn('[api/microsoft/push] error', err);
    return new Response('OK');
  }
}


