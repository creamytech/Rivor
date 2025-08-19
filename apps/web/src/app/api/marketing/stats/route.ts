import { NextResponse } from "next/server";

export async function GET() {
  // In a real application these values could come from a database or external service
  return NextResponse.json({
    agents: 500,
    deals: 2.4,
    satisfaction: 98,
  });
}
