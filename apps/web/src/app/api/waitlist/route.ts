import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

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

interface WaitlistEntry {
  id: string;
  email: string;
  firstName?: string;
  role?: string;
  note?: string;
  consent: boolean;
  source: string;
  createdAt: string;
  ip?: string;
}

// Simple file-based storage (replace with database in production)
const WAITLIST_FILE = path.join(process.cwd(), 'data', 'waitlist.json');

async function ensureDataDirectory() {
  const dataDir = path.dirname(WAITLIST_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

async function readWaitlist(): Promise<WaitlistEntry[]> {
  try {
    const data = await fs.readFile(WAITLIST_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeWaitlist(entries: WaitlistEntry[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(WAITLIST_FILE, JSON.stringify(entries, null, 2));
}

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

    // Read existing entries
    const entries = await readWaitlist();
    
    // Check if email already exists
    const existingEntry = entries.find(entry => entry.email.toLowerCase() === validatedData.email.toLowerCase());
    if (existingEntry) {
      return NextResponse.json(
        { error: 'This email is already on our waitlist.' },
        { status: 409 }
      );
    }

    // Create new entry
    const newEntry: WaitlistEntry = {
      id: crypto.randomUUID(),
      email: validatedData.email.toLowerCase(),
      firstName: validatedData.firstName,
      role: validatedData.role,
      note: validatedData.note,
      consent: validatedData.consent,
      source: validatedData.source,
      createdAt: new Date().toISOString(),
      ip: ip !== 'unknown' ? ip : undefined,
    };

    // Add to entries and save
    entries.push(newEntry);
    await writeWaitlist(entries);

    // Log for analytics (in production, send to analytics service)
    console.log(`New waitlist signup: ${newEntry.email} (${newEntry.role || 'no role'}) from ${newEntry.source}`);

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
    const entries = await readWaitlist();
    
    // Return anonymized stats only
    const stats = {
      total: entries.length,
      recent: entries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return entryDate > weekAgo;
      }).length,
      byRole: entries.reduce((acc, entry) => {
        const role = entry.role || 'not_specified';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Waitlist stats error:', error);
    return NextResponse.json(
      { error: 'Unable to fetch stats' },
      { status: 500 }
    );
  }
}