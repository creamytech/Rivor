import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { logger } from '@/lib/logger';

// Rate limiting - simple in-memory store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute per IP

// Validation schema
const waitlistSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().optional(),
  role: z.enum(['agent', 'broker', 'team', 'other']).optional(),
  note: z.string().optional(),
  consent: z.boolean(),
  source: z.string().default('marketing'),
});


function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const existing = rateLimitStore.get(ip);
  
  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (existing.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  existing.count++;
  return false;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real;
  }
  return request.ip || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    
    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = waitlistSchema.parse(body);

    if (!validatedData.consent) {
      return NextResponse.json(
        { error: 'Consent is required to join the waitlist.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEntry = await prisma.waitlist.findUnique({
      where: { email: validatedData.email.toLowerCase() }
    });
    
    if (existingEntry) {
      return NextResponse.json(
        { error: 'This email is already on our waitlist.' },
        { status: 409 }
      );
    }

    // Create new entry in database
    const newEntry = await prisma.waitlist.create({
      data: {
        email: validatedData.email.toLowerCase(),
        firstName: validatedData.firstName,
        role: validatedData.role,
        note: validatedData.note,
        consent: validatedData.consent,
        source: validatedData.source,
        ip: ip !== 'unknown' ? ip : undefined,
      }
    });

    // Log for analytics
    logger.info('New waitlist signup', {
      email: newEntry.email,
      role: newEntry.role || 'no role',
      source: newEntry.source,
      ip: newEntry.ip
    });

    return NextResponse.json({ ok: true, id: newEntry.id });

  } catch (error) {
    console.error('Waitlist API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided.', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get total count
    const total = await prisma.waitlist.count();
    
    // Get recent signups (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await prisma.waitlist.count({
      where: {
        createdAt: {
          gte: weekAgo
        }
      }
    });
    
    // Get role distribution
    const roleData = await prisma.waitlist.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });
    
    const byRole = roleData.reduce((acc, item) => {
      const role = item.role || 'not_specified';
      acc[role] = item._count.role;
      return acc;
    }, {} as Record<string, number>);
    
    // Return anonymized stats only
    const stats = {
      total,
      recent,
      byRole,
    };

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Waitlist stats error', { error });
    return NextResponse.json(
      { error: 'Unable to fetch stats' },
      { status: 500 }
    );
  }
}