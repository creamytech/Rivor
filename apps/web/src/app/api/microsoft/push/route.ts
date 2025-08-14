import { NextRequest } from 'next/server';
import { enqueueEmailSync } from '@/server/queue';

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
    for (const n of notifications) {
      const orgId = n?.clientState?.orgId as string | undefined;
      const emailAccountId = n?.clientState?.emailAccountId as string | undefined;
      if (orgId && emailAccountId) {
        await enqueueEmailSync(orgId, emailAccountId);
      }
    }
    return new Response('OK');
  } catch (err) {
    console.warn('[api/microsoft/push] error', err);
    return new Response('OK');
  }
}


