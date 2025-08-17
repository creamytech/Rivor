import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Test basic database connectivity
    const emailAccounts = await prisma.emailAccount.count({
      where: { orgId }
    });

    const threads = await prisma.emailThread.count({
      where: { orgId }
    });

    const messages = await prisma.emailMessage.count({
      where: { orgId }
    });

    return NextResponse.json({
      success: true,
      user: {
        email: session.user.email,
        name: session.user.name,
        orgId
      },
      stats: {
        emailAccounts,
        threads,
        messages
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test app error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
