import { NextResponse } from 'next/server';
import { notifications } from '../../data';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const notification = notifications.find(n => n.id === params.id);
  if (notification) {
    notification.isRead = true;
  }
  return NextResponse.json({ success: true });
}
