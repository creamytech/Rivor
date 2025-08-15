import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

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

    // Get detailed account information
    const emailAccounts = await prisma.emailAccount.findMany({
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

    // Analyze issues
    const issues = [];
    
    for (const account of emailAccounts) {
      if (account.tokenStatus !== 'encrypted') {
        issues.push({
          type: 'token_encryption',
          accountId: account.id,
          provider: account.provider,
          email: account.email,
          tokenStatus: account.tokenStatus,
          encryptionStatus: account.encryptionStatus,
          kmsErrorCode: account.kmsErrorCode,
          description: `Token not encrypted: ${account.tokenStatus}`
        });
      }
      
      if (account.status !== 'connected') {
        issues.push({
          type: 'connection_status',
          accountId: account.id,
          provider: account.provider,
          email: account.email,
          status: account.status,
          errorReason: account.errorReason,
          description: `Account not connected: ${account.status}`
        });
      }
      
      if (account.encryptionStatus !== 'ok') {
        issues.push({
          type: 'encryption_failed',
          accountId: account.id,
          provider: account.provider,
          email: account.email,
          encryptionStatus: account.encryptionStatus,
          kmsErrorCode: account.kmsErrorCode,
          description: `Encryption failed: ${account.encryptionStatus}`
        });
      }
    }

    return NextResponse.json({
      orgId,
      organization: org,
      emailAccounts,
      calendarAccounts,
      issues,
      summary: {
        totalEmailAccounts: emailAccounts.length,
        totalCalendarAccounts: calendarAccounts.length,
        totalIssues: issues.length,
        hasKmsKey: !!org?.encryptedDekBlob
      },
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
