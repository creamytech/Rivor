import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const orgs = await prisma.org.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      orgCount: orgs.length,
      orgs: orgs,
      defaultOrg: orgs[0] || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Check orgs error:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}