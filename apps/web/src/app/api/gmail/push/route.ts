import { NextRequest } from 'next/server';
import { enqueueEmailSync } from '@/server/queue';

export async function POST(req: NextRequest) {
  try {
    const token = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN;
    // Optional lightweight verification via header to avoid accidental hits
    const provided = req.headers.get('x-verification-token');
    if (token && provided && token !== provided) {
      return new Response('Forbidden', { status: 403 });
    }
    const body = await req.json().catch(() => null) as any;
    // Pub/Sub pushes JSON with message.data (base64). In production, decode and parse historyId/thread/account.
    const message = body?.message;
    const attributes = message?.attributes ?? {};
    const dataB64: string | undefined = message?.data;
    // Best effort: allow testing via attributes
    const orgId = attributes.orgId as string | undefined;
    const emailAccountId = attributes.emailAccountId as string | undefined;
    if (orgId && emailAccountId) {
      await enqueueEmailSync(orgId, emailAccountId);
    }
    return new Response('OK');
  } catch (err) {
    console.warn('[api/gmail/push] error', err);
    return new Response('OK');
  }
}


