import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(__request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Ping successful!',
    timestamp: new Date().toISOString()
  });
}
