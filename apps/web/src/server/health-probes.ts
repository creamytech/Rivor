import { google } from 'googleapis';
import { prisma } from './db';
import { createGoogleOAuthClient } from './token-validation';
import { logger } from '@/lib/logger';

export interface ProbeResult {
  provider: string;
  service: 'gmail' | 'calendar';
  success: boolean;
  timestamp: Date;
  error?: string;
  latency?: number;
  correlationId: string;
}

export interface ProbeCache {
  result: ProbeResult;
  cacheKey: string;
  ttl: number; // seconds
}

// Redis-like cache for probe results (10 minute TTL)
const probeCache = new Map<string, { result: ProbeResult; expires: number }>();
const PROBE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Get cached probe result if still valid
 */
function getCachedProbe(cacheKey: string): ProbeResult | null {
  const cached = probeCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return cached.result;
  }
  
  // Remove expired cache entry
  if (cached) {
    probeCache.delete(cacheKey);
  }
  
  return null;
}

/**
 * Cache probe result
 */
function cacheProbeResult(cacheKey: string, result: ProbeResult): void {
  probeCache.set(cacheKey, {
    result,
    expires: Date.now() + PROBE_CACHE_TTL
  });
}

/**
 * Probe Gmail health using users.getProfile (lightweight)
 */
export async function probeGmailHealth(orgId: string, force = false): Promise<ProbeResult> {
  const correlationId = `gmail-probe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const cacheKey = `gmail:${orgId}`;
  
  // Return cached result unless forced
  if (!force) {
    const cached = getCachedProbe(cacheKey);
    if (cached) {
      logger.debug('Returning cached Gmail probe result', {
        orgId,
        correlationId,
        cachedAt: cached.timestamp,
        action: 'probe_cache_hit'
      });
      return cached;
    }
  }

  const startTime = Date.now();
  
  try {
    logger.info('Starting Gmail health probe', {
      orgId,
      correlationId,
      force,
      action: 'gmail_probe_start'
    });

    // Find Google OAuth account for this org
    const org = await prisma.org.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new Error('Organization not found');
    }

    const oauthAccount = await prisma.oAuthAccount.findFirst({
      where: {
        provider: 'google',
        userId: org.name // org.name is the user's email
      }
    });

    if (!oauthAccount) {
      throw new Error('No Google OAuth account found');
    }

    // Check if account has Gmail scopes
    const scopes = oauthAccount.scope?.split(' ') || [];
    const hasGmailScope = scopes.includes('https://www.googleapis.com/auth/gmail.readonly');
    
    if (!hasGmailScope) {
      throw new Error('Missing Gmail scope: gmail.readonly');
    }

    // Create OAuth client with automatic token refresh
    const auth = await createGoogleOAuthClient(orgId, oauthAccount.id);
    const gmail = google.gmail({ version: 'v1', auth });

    // Perform lightweight probe - users.getProfile
    await gmail.users.getProfile({ userId: 'me' });

    const latency = Date.now() - startTime;
    const result: ProbeResult = {
      provider: 'google',
      service: 'gmail',
      success: true,
      timestamp: new Date(),
      latency,
      correlationId
    };

    // Cache the successful result
    cacheProbeResult(cacheKey, result);

    logger.info('Gmail health probe successful', {
      orgId,
      correlationId,
      latency,
      action: 'gmail_probe_success'
    });

    return result;
  } catch (error: any) {
    const latency = Date.now() - startTime;
    const result: ProbeResult = {
      provider: 'google',
      service: 'gmail',
      success: false,
      timestamp: new Date(),
      error: error.message || 'Unknown error',
      latency,
      correlationId
    };

    // Cache failed results for shorter duration (2 minutes)
    const failureCacheKey = `${cacheKey}:failed`;
    probeCache.set(failureCacheKey, {
      result,
      expires: Date.now() + (2 * 60 * 1000) // 2 minutes
    });

    logger.error('Gmail health probe failed', {
      orgId,
      correlationId,
      error: error.message,
      latency,
      action: 'gmail_probe_failed'
    });

    return result;
  }
}

/**
 * Probe Calendar health using calendarList.list (lightweight)
 */
export async function probeCalendarHealth(orgId: string, force = false): Promise<ProbeResult> {
  const correlationId = `calendar-probe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const cacheKey = `calendar:${orgId}`;
  
  // Return cached result unless forced
  if (!force) {
    const cached = getCachedProbe(cacheKey);
    if (cached) {
      logger.debug('Returning cached Calendar probe result', {
        orgId,
        correlationId,
        cachedAt: cached.timestamp,
        action: 'probe_cache_hit'
      });
      return cached;
    }
  }

  const startTime = Date.now();
  
  try {
    logger.info('Starting Calendar health probe', {
      orgId,
      correlationId,
      force,
      action: 'calendar_probe_start'
    });

    // Find Google OAuth account for this org
    const org = await prisma.org.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new Error('Organization not found');
    }

    const oauthAccount = await prisma.oAuthAccount.findFirst({
      where: {
        provider: 'google',
        userId: org.name // org.name is the user's email
      }
    });

    if (!oauthAccount) {
      throw new Error('No Google OAuth account found');
    }

    // Check if account has Calendar scopes
    const scopes = oauthAccount.scope?.split(' ') || [];
    const hasCalendarScope = scopes.includes('https://www.googleapis.com/auth/calendar.readonly');
    
    if (!hasCalendarScope) {
      throw new Error('Missing Calendar scope: calendar.readonly');
    }

    // Create OAuth client with automatic token refresh
    const auth = await createGoogleOAuthClient(orgId, oauthAccount.id);
    const calendar = google.calendar({ version: 'v3', auth });

    // Perform lightweight probe - calendarList.list
    await calendar.calendarList.list({ maxResults: 1 });

    const latency = Date.now() - startTime;
    const result: ProbeResult = {
      provider: 'google',
      service: 'calendar',
      success: true,
      timestamp: new Date(),
      latency,
      correlationId
    };

    // Cache the successful result
    cacheProbeResult(cacheKey, result);

    logger.info('Calendar health probe successful', {
      orgId,
      correlationId,
      latency,
      action: 'calendar_probe_success'
    });

    return result;
  } catch (error: any) {
    const latency = Date.now() - startTime;
    const result: ProbeResult = {
      provider: 'google',
      service: 'calendar',
      success: false,
      timestamp: new Date(),
      error: error.message || 'Unknown error',
      latency,
      correlationId
    };

    // Cache failed results for shorter duration (2 minutes)
    const failureCacheKey = `${cacheKey}:failed`;
    probeCache.set(failureCacheKey, {
      result,
      expires: Date.now() + (2 * 60 * 1000) // 2 minutes
    });

    logger.error('Calendar health probe failed', {
      orgId,
      correlationId,
      error: error.message,
      latency,
      action: 'calendar_probe_failed'
    });

    return result;
  }
}

/**
 * Probe both Gmail and Calendar health in parallel
 */
export async function probeAllGoogleServices(orgId: string, force = false): Promise<{
  gmail: ProbeResult;
  calendar: ProbeResult;
}> {
  const correlationId = `all-probes-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('Starting comprehensive Google services health probe', {
    orgId,
    correlationId,
    force,
    action: 'all_probes_start'
  });

  try {
    // Run probes in parallel for better performance
    const [gmailResult, calendarResult] = await Promise.all([
      probeGmailHealth(orgId, force),
      probeCalendarHealth(orgId, force)
    ]);

    logger.info('Comprehensive Google services health probe completed', {
      orgId,
      correlationId,
      gmailSuccess: gmailResult.success,
      calendarSuccess: calendarResult.success,
      action: 'all_probes_complete'
    });

    return {
      gmail: gmailResult,
      calendar: calendarResult
    };
  } catch (error: any) {
    logger.error('Comprehensive Google services health probe failed', {
      orgId,
      correlationId,
      error: error.message,
      action: 'all_probes_failed'
    });

    // Return failed results for both services
    const now = new Date();
    return {
      gmail: {
        provider: 'google',
        service: 'gmail',
        success: false,
        timestamp: now,
        error: error.message,
        correlationId
      },
      calendar: {
        provider: 'google',
        service: 'calendar',
        success: false,
        timestamp: now,
        error: error.message,
        correlationId
      }
    };
  }
}

/**
 * Get cached probe results for display
 */
export function getCachedProbeResults(orgId: string): {
  gmail: ProbeResult | null;
  calendar: ProbeResult | null;
} {
  return {
    gmail: getCachedProbe(`gmail:${orgId}`),
    calendar: getCachedProbe(`calendar:${orgId}`)
  };
}

/**
 * Clear probe cache for an organization (useful after token refresh)
 */
export function clearProbeCache(orgId: string): void {
  probeCache.delete(`gmail:${orgId}`);
  probeCache.delete(`calendar:${orgId}`);
  probeCache.delete(`gmail:${orgId}:failed`);
  probeCache.delete(`calendar:${orgId}:failed`);
  
  logger.info('Cleared probe cache', {
    orgId,
    action: 'probe_cache_cleared'
  });
}

/**
 * Get probe cache statistics
 */
export function getProbeCacheStats(): {
  totalEntries: number;
  expiredEntries: number;
  activeEntries: number;
} {
  const now = Date.now();
  let totalEntries = 0;
  let expiredEntries = 0;
  let activeEntries = 0;

  for (const [key, cached] of probeCache.entries()) {
    totalEntries++;
    if (now >= cached.expires) {
      expiredEntries++;
    } else {
      activeEntries++;
    }
  }

  return {
    totalEntries,
    expiredEntries,
    activeEntries
  };
}
