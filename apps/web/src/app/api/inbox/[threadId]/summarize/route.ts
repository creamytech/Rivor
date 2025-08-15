import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { summarizeThread } from '@/server/ai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(_req: NextRequest, { params }: { params: { threadId: string } }) {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const orgId = (session as unknown).orgId as string | undefined;
  if (!orgId) return new Response('Forbidden', { status: 403 });
  await summarizeThread(orgId, params.threadId, 'short');
  return new Response('OK');
}

export const GET = POST;


