import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to check account status and identify token issues
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get detailed account information - try modern schema first, fallback to basic
    let emailAccounts;
    let schemaVersion = 'unknown';
    
    try {
      // Try modern schema with all fields
      emailAccounts = await prisma.emailAccount.findMany({
        where: { orgId },
        select: {
          id: true,
          provider: true,
          email: true,
          status: true,
          syncStatus: true,
          encryptionStatus: true,
          tokenStatus: true,
          tokenRef: true,
          errorReason: true,
          kmsErrorCode: true,
          kmsErrorAt: true,
          lastSyncedAt: true,
          createdAt: true,
          updatedAt: true
        }
      });
      schemaVersion = 'modern';
    } catch (error) {
      // Fallback to basic schema (original migration)
      try {
        emailAccounts = await prisma.emailAccount.findMany({
          where: { orgId },
          select: {
            id: true,
            provider: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        });
        schemaVersion = 'basic';
      } catch (basicError) {
        throw new Error(`Schema compatibility issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: { orgId },
      select: {
        id: true,
        provider: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Get organization info
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        encryptedDekBlob: true,
        createdAt: true
      }
    });

    // Analyze issues based on schema version
    const issues = [];
    
    for (const account of emailAccounts) {
      if (schemaVersion === 'modern') {
        // Modern schema analysis
        const modernAccount = account as any;
        
        if (modernAccount.tokenStatus && modernAccount.tokenStatus !== 'encrypted') {
          issues.push({
            type: 'token_encryption',
            accountId: account.id,
            provider: account.provider,
            email: modernAccount.email,
            tokenStatus: modernAccount.tokenStatus,
            encryptionStatus: modernAccount.encryptionStatus,
            kmsErrorCode: modernAccount.kmsErrorCode,
            description: `Token not encrypted: ${modernAccount.tokenStatus}`
          });
        }
        
        if (modernAccount.status !== 'connected') {
          issues.push({
            type: 'connection_status',
            accountId: account.id,
            provider: account.provider,
            email: modernAccount.email,
            status: modernAccount.status,
            errorReason: modernAccount.errorReason,
            description: `Account not connected: ${modernAccount.status}`
          });
        }
        
        if (modernAccount.encryptionStatus && modernAccount.encryptionStatus !== 'ok') {
          issues.push({
            type: 'encryption_failed',
            accountId: account.id,
            provider: account.provider,
            email: modernAccount.email,
            encryptionStatus: modernAccount.encryptionStatus,
            kmsErrorCode: modernAccount.kmsErrorCode,
            description: `Encryption failed: ${modernAccount.encryptionStatus}`
          });
        }
      } else {
        // Basic schema analysis - limited info available
        if (account.status !== 'connected') {
          issues.push({
            type: 'connection_status',
            accountId: account.id,
            provider: account.provider,
            status: account.status,
            description: `Account not connected: ${account.status}`
          });
        }
        
        // For basic schema, we assume tokens need migration
        issues.push({
          type: 'schema_outdated',
          accountId: account.id,
          provider: account.provider,
          description: 'Database schema needs migration - missing token encryption fields'
        });
      }
    }

    return NextResponse.json({
      orgId,
      organization: org,
      schemaVersion,
      emailAccounts,
      calendarAccounts,
      issues,
      summary: {
        totalEmailAccounts: emailAccounts.length,
        totalCalendarAccounts: calendarAccounts.length,
        totalIssues: issues.length,
        hasKmsKey: !!org?.encryptedDekBlob,
        needsMigration: schemaVersion === 'basic'
      },
      recommendations: schemaVersion === 'basic' ? [
        'Database schema is outdated and missing token encryption fields',
        'Run database migrations to add missing fields: tokenStatus, encryptionStatus, etc.',
        'Command: npm run db:migrate:deploy'
      ] : [],
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Account status debug error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get account status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
