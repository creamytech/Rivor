import { NextRequest } from 'next/server';

export function getOrgIdFromRequest(req: NextRequest): string | null {
  const header = req.headers.get('x-org-id');
  return header || null;
}

export function assertOrgAccess(orgId: string | null) {
  if (!orgId) {
    throw new Response('Org not found', { status: 403 });
  }
}

export function getAadForOrgField(orgId: string): Uint8Array {
  return new Uint8Array(Buffer.from(`org:${orgId}`));
}