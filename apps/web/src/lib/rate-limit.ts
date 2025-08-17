import { NextRequest } from 'next/server';

// Simple in-memory rate limiting (in production, use Redis or database)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const attempts = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts.entries()) {
    if (entry.resetTime < now) {
      attempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

/**
 * Rate limit authentication attempts
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  // const windowStart = now - config.windowMs; // TODO: Use if needed for sliding window
  
  const entry = attempts.get(identifier);
  
  if (!entry || entry.resetTime < now) {
    // First attempt or window expired, reset counter
    attempts.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs
    });
    
    return {
      success: true,
      remaining: config.maxAttempts - 1,
      resetTime: now + config.windowMs
    };
  }
  
  if (entry.count >= config.maxAttempts) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      error: 'Too many attempts. Please try again later.'
    };
  }
  
  // Increment counter
  entry.count += 1;
  
  return {
    success: true,
    remaining: config.maxAttempts - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Get IP address from request for rate limiting
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  // Fallback to connection IP
  return request.ip || 'unknown';
}

/**
 * Create rate limit identifier from IP and optional user info
 */
export function createRateLimitKey(ip: string, userIdentifier?: string): string {
  if (userIdentifier) {
    return `auth:${userIdentifier}:${ip}`;
  }
  return `auth:ip:${ip}`;
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Max 5 attempts per IP per 15 minutes
  IP_AUTH: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000
  },
  
  // Max 3 attempts per email per hour
  EMAIL_AUTH: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000
  },
  
  // Max 100 general auth requests per IP per minute (increased for development)
  IP_GENERAL: {
    maxAttempts: 100,
    windowMs: 60 * 1000
  }
} as const;
