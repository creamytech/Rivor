import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { logger } from "@/lib/logger";
import { getMergeData } from "@/server/documents";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const contactId = searchParams.get('contactId');

    // Get merge data for the specified deal or contact
    const mergeData = await getMergeData(dealId || undefined, contactId || undefined);

    // Add current user info
    const enrichedMergeData = {
      ...mergeData,
      agent: {
        name: session.user?.name || '',
        email: session.user?.email || '',
      },
      date: new Date(),
      time: new Date(),
    };

    logger.info('Merge data fetched', {
      userId: session.user?.email,
      dealId,
      contactId,
      fieldsCount: Object.keys(enrichedMergeData).length
    });

    return NextResponse.json(enrichedMergeData);

  } catch (error) {
    logger.error('Failed to fetch merge data', { error });
    return NextResponse.json(
      { error: "Failed to fetch merge data" },
      { status: 500 }
    );
  }
}