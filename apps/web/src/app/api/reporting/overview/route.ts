import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { auth } from "@/server/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';

    // Calculate date range based on timeframe
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'ytd':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);

    // Fetch deals data
    const [currentDeals, previousDeals] = await Promise.all([
      prisma.lead.findMany({
        where: {
          orgId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      prisma.lead.findMany({
        where: {
          orgId,
          createdAt: {
            gte: previousStartDate,
            lt: startDate
          }
        }
      })
    ]);

    // Calculate metrics
    const totalDeals = currentDeals.length;
    const previousTotalDeals = previousDeals.length;
    
    const totalValue = currentDeals.reduce((sum, deal) => sum + (deal.propertyValue || 0), 0);
    const previousTotalValue = previousDeals.reduce((sum, deal) => sum + (deal.propertyValue || 0), 0);
    
    const closedDeals = currentDeals.filter(deal => deal.status === 'closed').length;
    const previousClosedDeals = previousDeals.filter(deal => deal.status === 'closed').length;
    
    const activeLeads = currentDeals.filter(deal => deal.status === 'active').length;
    const previousActiveLeads = previousDeals.filter(deal => deal.status === 'active').length;
    
    const conversionRate = totalDeals > 0 ? (closedDeals / totalDeals) * 100 : 0;
    const previousConversionRate = previousTotalDeals > 0 ? (previousClosedDeals / previousTotalDeals) * 100 : 0;

    // Calculate average deal time (mock for now)
    const avgDealTime = 45; // This would be calculated from actual deal lifecycle data

    // Calculate trends
    const dealsChange = previousTotalDeals > 0 ? ((totalDeals - previousTotalDeals) / previousTotalDeals) * 100 : 0;
    const valueChange = previousTotalValue > 0 ? ((totalValue - previousTotalValue) / previousTotalValue) * 100 : 0;
    const conversionChange = previousConversionRate > 0 ? ((conversionRate - previousConversionRate) / previousConversionRate) * 100 : 0;
    const leadsChange = previousActiveLeads > 0 ? ((activeLeads - previousActiveLeads) / previousActiveLeads) * 100 : 0;

    const reportingData = {
      overview: {
        totalDeals,
        totalValue,
        conversionRate,
        avgDealTime,
        activeLeads,
        closedDeals
      },
      trends: {
        dealsChange,
        valueChange,
        conversionChange,
        leadsChange
      },
      timeframe,
      lastUpdated: new Date()
    };

    logger.info('Reporting overview fetched', {
      userId: session.user?.email,
      orgId,
      timeframe,
      totalDeals,
      totalValue
    });

    return NextResponse.json(reportingData);

  } catch (error) {
    logger.error('Failed to fetch reporting overview', { error });
    return NextResponse.json(
      { error: "Failed to fetch reporting overview" },
      { status: 500 }
    );
  }
}