import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { searchProperties } from '@/server/mls';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const location = searchParams.get('location') || undefined;
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const beds = searchParams.get('beds');

  try {
    const results = await searchProperties({
      location,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      beds: beds ? Number(beds) : undefined,
    });
    return Response.json(results);
  } catch (err) {
    console.error('MLS search failed', err);
    return new Response('MLS search failed', { status: 500 });
  }
}
