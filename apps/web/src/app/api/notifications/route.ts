import { NextResponse } from 'next/server';
import { notifications } from './data';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(notifications);
}
