import { auth } from '@/server/auth';
import { listThreads } from '@/server/email';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const orgId = (session as any).orgId as string | undefined;
  if (!orgId) return new Response('Forbidden', { status: 403 });
  const data = await listThreads(orgId, 50);
  return Response.json({ threads: data });
}


