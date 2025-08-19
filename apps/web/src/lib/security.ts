import { headers } from 'next/headers';
import { auth } from '@/server/auth';

/**
 * Security utilities for row-level access control and data protection
 */

export interface SecurityContext {
  userId: string;
  userEmail: string;
  orgId: string;
  role: 'owner' | 'admin' | 'member';
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Get security context for the current request
 */
export async function getSecurityContext(): Promise<SecurityContext | null> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return null;
    }

    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    return {
      userId: session.user.id || session.user.email,
      userEmail: session.user.email,
      orgId: (session as unknown as { orgId: string }).orgId,
      role: (session as unknown as { role: 'owner' | 'admin' | 'member' }).role || 'member',
      ipAddress,
      userAgent
    };
  } catch (error) {
    console.error('Failed to get security context:', error);
    return null;
  }
}

/**
 * Check if user has permission to access a resource
 */
export function hasPermission(
  context: SecurityContext | null,
  resource: string,
  action: 'read' | 'write' | 'delete' | 'admin'
): boolean {
  if (!context) {
    return false;
  }

  // Owner has all permissions
  if (context.role === 'owner') {
    return true;
  }

  // Admin permissions
  if (context.role === 'admin') {
    switch (action) {
      case 'read':
      case 'write':
        return true;
      case 'delete':
        return ['lead', 'contact', 'task', 'email'].includes(resource);
      case 'admin':
        return ['user_management', 'integrations', 'settings'].includes(resource);
      default:
        return false;
    }
  }

  // Member permissions
  if (context.role === 'member') {
    switch (action) {
      case 'read':
        return true;
      case 'write':
        return ['lead', 'contact', 'task', 'note'].includes(resource);
      case 'delete':
        return ['task', 'note'].includes(resource); // Can delete tasks and notes
      case 'admin':
        return false;
      default:
        return false;
    }
  }

  return false;
}

/**
 * Generate WHERE clause for row-level security
 */
export function getOrgScopedWhere(context: SecurityContext | null, additionalWhere: Record<string, unknown> = {}) {
  if (!context) {
    throw new Error('Unauthorized: No security context');
  }

  return {
    orgId: context.orgId,
    ...additionalWhere
  };
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    // Basic XSS protection - remove script tags and dangerous attributes
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/onload=/gi, '')
      .replace(/onerror=/gi, '')
      .trim();
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      // Sanitize object keys and values
      const cleanKey = sanitizeInput(key);
      sanitized[cleanKey] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

/**
 * Rate limiting check
 */
export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  identifier?: string;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  context: SecurityContext | null,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetTime: number } {
  const identifier = options.identifier || 
                    context?.userEmail || 
                    context?.ipAddress || 
                    'anonymous';
  
  const now = Date.now();
  // const windowStart = now - options.windowMs; // TODO: Use if needed for sliding window
  
  // Clean up old entries
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
  
  const current = rateLimitStore.get(identifier) || { count: 0, resetTime: now + options.windowMs };
  
  if (current.resetTime < now) {
    // Reset window
    current.count = 0;
    current.resetTime = now + options.windowMs;
  }
  
  const allowed = current.count < options.maxRequests;
  
  if (allowed) {
    current.count++;
    rateLimitStore.set(identifier, current);
  }
  
  return {
    allowed,
    remaining: Math.max(0, options.maxRequests - current.count),
    resetTime: current.resetTime
  };
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  userId: string;
  orgId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high';
  metadata?: Record<string, unknown>;
}

/**
 * Log audit event
 */
export async function logAuditEvent(
  context: SecurityContext,
  entry: Omit<AuditLogEntry, 'userId' | 'orgId' | 'ipAddress' | 'userAgent'>
) {
  const auditEntry: AuditLogEntry = {
    userId: context.userId,
    orgId: context.orgId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    ...entry
  };

  // Log structured audit event
  console.log('AUDIT_EVENT:', JSON.stringify(auditEntry));

  // In production, store in audit log table:
  // await prisma.auditLog.create({ data: auditEntry });
}

/**
 * Data export security check
 */
export function validateDataExportRequest(
  context: SecurityContext | null,
  dataType: string,
  dateRange?: { start: Date; end: Date }
): { allowed: boolean; reason?: string } {
  if (!context) {
    return { allowed: false, reason: 'Authentication required' };
  }

  // Only owners and admins can export data
  if (!['owner', 'admin'].includes(context.role)) {
    return { allowed: false, reason: 'Insufficient permissions' };
  }

  // Limit export date range to prevent abuse
  if (dateRange) {
    const maxRangeMs = 90 * 24 * 60 * 60 * 1000; // 90 days
    const rangeMs = dateRange.end.getTime() - dateRange.start.getTime();
    
    if (rangeMs > maxRangeMs) {
      return { allowed: false, reason: 'Date range too large (max 90 days)' };
    }
  }

  return { allowed: true };
}

/**
 * Account deletion security check
 */
export function validateAccountDeletion(
  context: SecurityContext | null,
  targetUserId?: string
): { allowed: boolean; reason?: string } {
  if (!context) {
    return { allowed: false, reason: 'Authentication required' };
  }

  // Users can delete their own account
  if (!targetUserId || targetUserId === context.userId) {
    return { allowed: true };
  }

  // Only owners can delete other accounts
  if (context.role !== 'owner') {
    return { allowed: false, reason: 'Only organization owners can delete other accounts' };
  }

  return { allowed: true };
}
