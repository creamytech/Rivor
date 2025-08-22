import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

export async function GET(request: NextRequest) {
  try {
    // For now, return mock stats until we have real data
    const stats = {
      totalDeals: 47,
      totalValue: 12500000,
      averageDealSize: 265957,
      conversionRate: 23.5,
      averageCycleTime: 34,
      hotLeads: 8
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch pipeline stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline stats' },
      { status: 500 }
    );
  }
}