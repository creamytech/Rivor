import { prisma } from './db';

export async function searchThreads(orgId: string, q: string, limit = 50) {
  if (!q.trim()) return [] as { id: string }[];
  // Simple sanitized token search using ILIKE on prebuilt indexes
  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `%${t.replace(/[%_]/g, '')}%`);
  if (tokens.length === 0) return [] as { id: string }[];
  const where: any = {
    orgId,
    OR: [
      { subjectIndex: { contains: tokens[0] } },
      { participantsIndex: { contains: tokens[0] } },
    ],
  };
  const rows = await prisma.emailThread.findMany({
    where,
    take: limit,
    select: { id: true },
  });
  return rows;
}


