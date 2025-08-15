import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getUnreadCount } from "@/server/email";
import { getCalendarStats } from "@/server/calendar";
import { getOverallPipelineStats } from "@/server/pipeline";

// Force dynamic rendering - this route uses session/auth data
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session as any).orgId;
    const userEmail = session.user?.email;

    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Fetch basic stats in parallel
    const [unreadCount, calendarStats, pipelineStats] = await Promise.all([
      getUnreadCount(orgId).catch(() => 0),
      getCalendarStats(orgId).catch(() => ({ todayCount: 0, upcomingCount: 0 })),
      getOverallPipelineStats(orgId).catch(() => ({ activeLeads: 0, wonLeads: 0, lostLeads: 0, totalLeads: 0 }))
    ]);

    return NextResponse.json({
      unreadCount,
      todayMeetings: calendarStats.todayCount,
      upcomingMeetings: calendarStats.upcomingCount,
      activeDeals: pipelineStats.activeLeads,
      totalDeals: pipelineStats.totalLeads,
      wonDeals: pipelineStats.wonLeads,
      user: {
        name: session.user?.name,
        email: session.user?.email
      }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
