import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Fix endpoint to retry token encryption for accounts with failed tokens
 * This will mark accounts for re-authentication
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Find accounts with token issues (handle schema compatibility)
    let problemAccounts;
    let schemaVersion = 'unknown';
    
    try {
      // Try modern schema first
      problemAccounts = await prisma.emailAccount.findMany({
        where: {
          orgId,
          OR: [
            { tokenStatus: { not: 'encrypted' } },
            { encryptionStatus: { not: 'ok' } },
            { status: 'action_needed' }
          ]
        }
      });
      schemaVersion = 'modern';
    } catch (error) {
      // Fallback to basic schema - just get all accounts
      try {
        problemAccounts = await prisma.emailAccount.findMany({
          where: { orgId }
        });
        schemaVersion = 'basic';
      } catch (basicError) {
        return NextResponse.json({
          error: 'Database schema compatibility issue',
          details: error instanceof Error ? error.message : 'Unknown error',
          recommendation: 'Database needs migration to support token management'
        }, { status: 500 });
      }
    }

    if (problemAccounts.length === 0) {
      return NextResponse.json({
        message: 'No accounts found with token issues',
        accountsFixed: 0,
        schemaVersion
      });
    }

    // Reset accounts to require re-authentication (based on schema)
    let updateResults;
    
    if (schemaVersion === 'modern') {
      // Modern schema - update all fields
      updateResults = await Promise.all(
        problemAccounts.map(account => 
          prisma.emailAccount.update({
            where: { id: account.id },
            data: {
              status: 'action_needed',
              tokenStatus: 'pending_encryption',
              encryptionStatus: 'pending',
              tokenRef: null,
              errorReason: 'Token encryption failed - please reconnect account',
              kmsErrorCode: null,
              kmsErrorAt: new Date()
            }
          })
        )
      );
    } else {
      // Basic schema - only update status
      updateResults = await Promise.all(
        problemAccounts.map(account => 
          prisma.emailAccount.update({
            where: { id: account.id },
            data: {
              status: 'action_needed'
            }
          })
        )
      );
    }

    return NextResponse.json({
      message: 'Accounts marked for re-authentication',
      accountsFixed: updateResults.length,
      schemaVersion,
      accounts: updateResults.map(acc => ({
        id: acc.id,
        email: (acc as any).email || 'Unknown',
        provider: acc.provider,
        status: acc.status
      })),
      nextSteps: schemaVersion === 'basic' ? [
        '1. FIRST: Run database migration to add missing fields',
        '2. Command: npm run db:migrate:deploy',
        '3. Then go to Settings > Integrations',
        '4. Disconnect and reconnect your Google account',
        '5. Grant all required permissions when prompted'
      ] : [
        '1. Go to Settings > Integrations',
        '2. Disconnect and reconnect your Google account',
        '3. Grant all required permissions when prompted',
        '4. Check that the account shows as "Connected" afterwards'
      ]
    });

  } catch (error: unknown) {
    console.error('Fix tokens error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix token issues',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
