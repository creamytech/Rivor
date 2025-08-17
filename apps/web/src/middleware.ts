import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, getClientIP, createRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply rate limiting to auth endpoints
  if (pathname.startsWith('/api/auth/')) {
    const ip = getClientIP(request);
    
    // Rate limit OAuth provider requests more strictly
    if (pathname.includes('/signin/') || pathname.includes('/callback/')) {
      const rateLimitKey = createRateLimitKey(ip);
      const result = rateLimit(rateLimitKey, RATE_LIMITS.IP_AUTH);
      
      if (!result.success) {
        // Log rate limit exceeded event
        logger.rateLimitEvent(rateLimitKey, RATE_LIMITS.IP_AUTH.maxAttempts, RATE_LIMITS.IP_AUTH.windowMs, ip);
        
        // Return error response for rate limit exceeded
        return NextResponse.redirect(new URL('/auth/error?error=RateLimited', request.url));
      }
      
      // Add rate limit headers for monitoring
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', RATE_LIMITS.IP_AUTH.maxAttempts.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      
      return response;
    }
    
    // General rate limiting for other auth endpoints
    const rateLimitKey = createRateLimitKey(ip);
    const result = rateLimit(rateLimitKey, RATE_LIMITS.IP_GENERAL);
    
    if (!result.success) {
      // Log rate limit exceeded for debugging
      logger.warn('Rate limit exceeded for auth endpoint', {
        pathname,
        ip,
        rateLimitKey,
        remaining: result.remaining,
        resetTime: result.resetTime
      });
      
      // Return JSON response for API endpoints to prevent NextAuth parsing errors
      return new NextResponse(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: 'Too many requests, please try again later'
        }), 
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }
  
  // CSRF protection for auth pages - ensure referrer is from same origin
  if (pathname.startsWith('/auth/') && request.method === 'GET') {
    // const referer = request.headers.get('referer'); // TODO: Use if needed for CSRF protection
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    // Allow direct navigation (no referer) but validate origin if present
    if (origin && origin !== `https://${host}` && origin !== `http://${host}`) {
      // Log suspicious origin for security monitoring
      logger.securityEvent('invalid_origin', {
        pathname,
        origin,
        host,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent')
      });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/auth/:path*'
  ]
};
