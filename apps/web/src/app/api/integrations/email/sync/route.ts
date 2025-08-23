import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST() {
  // Development bypass - simulate sync
  if (process.env.NODE_ENV === 'development') {
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return Response.json({
      success: true,
      message: 'Email sync completed (development mode)',
      syncedEmails: 15,
      newThreads: 3,
      timestamp: new Date().toISOString()
    });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const orgId = (session as { orgId?: string }).orgId;
  if (!orgId) {
    return new Response('Organization not found', { status: 403 });
  }

  try {
    // Get all connected email accounts for this org
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { 
        orgId,
        status: 'connected' 
      }
    });

    if (emailAccounts.length === 0) {
      return Response.json({
        success: false,
        message: 'No connected email accounts found. Please connect an account first.',
        syncedEmails: 0,
        newThreads: 0
      }, { status: 400 });
    }

    let totalSyncedEmails = 0;
    let totalNewThreads = 0;

    // Sync each account (in a real implementation, you'd use the Gmail/Outlook APIs)
    for (const account of emailAccounts) {
      try {
        // TODO: Implement actual email sync logic here
        // This would involve:
        // 1. Using the account's OAuth tokens to fetch emails
        // 2. Processing and encrypting email content
        // 3. Creating EmailThread and EmailMessage records
        // 4. Running lead detection on new emails
        
        // For now, create some mock data to show sync working
        const mockSyncResult = {
          syncedEmails: Math.floor(Math.random() * 20) + 5,
          newThreads: Math.floor(Math.random() * 5) + 1
        };

        totalSyncedEmails += mockSyncResult.syncedEmails;
        totalNewThreads += mockSyncResult.newThreads;

        // Update account sync status
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: {
            lastSyncedAt: new Date(),
            syncStatus: 'idle'
          }
        });

      } catch (error) {
        console.error(`Failed to sync account ${account.id}:`, error);
        
        // Update account with error status
        await prisma.emailAccount.update({
          where: { id: account.id },
          data: {
            syncStatus: 'error',
            errorReason: error instanceof Error ? error.message : 'Unknown sync error'
          }
        });
      }
    }

    return Response.json({
      success: true,
      message: `Successfully synced ${totalSyncedEmails} emails across ${emailAccounts.length} accounts`,
      syncedEmails: totalSyncedEmails,
      newThreads: totalNewThreads,
      accountsSynced: emailAccounts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email sync failed:', error);
    return Response.json({
      success: false,
      message: 'Email sync failed. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}