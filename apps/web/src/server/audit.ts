import { prisma } from './db';

export async function logAudit(params: {
  orgId: string;
  actorId?: string | null;
  action: string;
  purpose?: string | null;
  resource?: string | null;
  success: boolean;
  traceId?: string | null;
}) {
  const { orgId, actorId, action, purpose, resource, success, traceId } = params;
  try {
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: actorId ?? null,
        action,
        purpose: purpose ?? null,
        resource: resource ?? null,
        success,
        traceId: traceId ?? null,
      },
    });
  } catch (err) {
    console.warn('[audit] failed', { orgId, action }, err);
  }
}


