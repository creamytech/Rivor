import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(__request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Cache bust endpoint - force refresh your browser',
    timestamp: new Date().toISOString(),
    instructions: [
      '1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)',
      '2. Clear browser cache',
      '3. Try the Check button again'
    ]
  });
}
