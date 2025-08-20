import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Fix missing tokenStatus column
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if tokenStatus column exists
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'EmailAccount' AND table_schema = 'public' AND column_name = 'tokenStatus'
    ` as Array<{ column_name: string }>;

    if (columns.length > 0) {
      return NextResponse.json({
        message: 'tokenStatus column already exists',
        action: 'none',
        timestamp: new Date().toISOString()
      });
    }

    // Add the missing tokenStatus column
    await prisma.$executeRaw`
      ALTER TABLE "EmailAccount" 
      ADD COLUMN "tokenStatus" TEXT NOT NULL DEFAULT 'pending_encryption'
    `;

    // Add the comment for documentation
    await prisma.$executeRaw`
      COMMENT ON COLUMN "EmailAccount"."tokenStatus" IS 'Token encryption status: pending_encryption, encrypted, failed'
    `;

    // Verify the column was added
    const verifyColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'EmailAccount' AND table_schema = 'public' AND column_name = 'tokenStatus'
    ` as Array<{ column_name: string }>;

    return NextResponse.json({
      message: 'Successfully added tokenStatus column',
      action: 'column_added',
      verified: verifyColumns.length > 0,
      nextSteps: [
        'The tokenStatus column has been added to the EmailAccount table',
        'The schema should now be detected as "modern"',
        'Try signing out and back in with Google OAuth',
        'Check the account status endpoint again'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Fix missing column error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add missing column',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
