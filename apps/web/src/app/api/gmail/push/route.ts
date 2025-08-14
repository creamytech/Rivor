import { NextRequest } from 'next/server';
import { enqueueEmailSync } from '@/server/queue';
import { prisma } from '@/server/db';
import { GmailService } from '@/server/gmail';

export async function POST(req: NextRequest) {
  try {
    const token = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN;
    // Optional lightweight verification via header to avoid accidental hits
    const provided = req.headers.get('x-verification-token');
    if (token && provided && token !== provided) {
      return new Response('Forbidden', { status: 403 });
    }
    
    const body = await req.json().catch(() => null) as any;
    const message = body?.message;
    const attributes = message?.attributes ?? {};
    const dataB64: string | undefined = message?.data;
    
    // Decode the pub/sub data if available
    let notificationData: any = {};
    if (dataB64) {
      try {
        const decoded = Buffer.from(dataB64, 'base64').toString();
        notificationData = JSON.parse(decoded);
      } catch (parseError) {
        console.warn('[api/gmail/push] Failed to parse notification data:', parseError);
      }
    }
    
    // Extract email address and historyId from notification
    const emailAddress = notificationData.emailAddress || attributes.emailAddress;
    const historyId = notificationData.historyId || attributes.historyId;
    
    if (!emailAddress) {
      console.warn('[api/gmail/push] No email address in notification');
      return new Response('OK'); // Return OK to prevent retries
    }

    // Find the email account for this Gmail address
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        provider: 'google',
        id: { contains: emailAddress }
      }
    });

    if (!emailAccount) {
      console.warn(`[api/gmail/push] No account found for ${emailAddress}`);
      return new Response('OK');
    }

    // If we have historyId, do incremental sync, otherwise full sync
    if (historyId && emailAccount.historyId) {
      try {
        const gmailService = await GmailService.createFromAccount(emailAccount.orgId, emailAccount.id);
        await gmailService.handlePushNotification(emailAccount.orgId, emailAccount.id, historyId);
      } catch (error) {
        console.error('[api/gmail/push] Real-time sync failed, falling back to queued sync:', error);
        await enqueueEmailSync(emailAccount.orgId, emailAccount.id);
      }
    } else {
      // Fall back to queued full sync
      await enqueueEmailSync(emailAccount.orgId, emailAccount.id);
    }
    
    return new Response('OK');
  } catch (err) {
    console.warn('[api/gmail/push] error', err);
    return new Response('OK');
  }
}


