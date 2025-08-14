export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(req: Request) {
  const mod = await import('@/server/auth');
  return mod.handlers.GET(req);
}

export async function POST(req: Request) {
  const mod = await import('@/server/auth');
  return mod.handlers.POST(req);
}
