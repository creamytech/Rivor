import { Worker, Job } from "bullmq";
import { prisma } from "../server/db";
import { GmailService } from "../server/gmail";
import { MicrosoftGraphService } from "../server/microsoft-graph";
import { emailWorkflowService } from "../server/email-workflow";

function getConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  return { connection: { url } } as const;
}

async function processJob(job: Job) {
  const { orgId, emailAccountId } = job.data as { orgId: string; emailAccountId: string };
  console.log("[worker] email:sync", { orgId, emailAccountId });
  
  try {
    // Get email account to determine provider
    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId }
    });

    if (!emailAccount) {
      throw new Error(`Email account ${emailAccountId} not found`);
    }

    // Sync based on provider
    if (emailAccount.provider === 'google') {
      const gmailService = await GmailService.createFromAccount(orgId, emailAccountId);
      await gmailService.syncMessages(orgId, emailAccountId, emailAccount.historyId || undefined);
      
      // Set up push notifications if not already done
      if (!emailAccount.historyId) {
        await gmailService.watchMailbox(orgId, emailAccountId);
      }
      
    } else if (emailAccount.provider === 'azure-ad') {
      const graphService = await MicrosoftGraphService.createFromAccount(orgId, emailAccountId);
      await graphService.syncMessages(orgId, emailAccountId, emailAccount.historyId || undefined);
      
      // Set up webhook if not already done
      if (!emailAccount.historyId) {
        await graphService.createSubscription(orgId, emailAccountId);
      }
      
      // Also sync calendar events
      await graphService.syncCalendar(orgId, emailAccountId);
    }

    // Update account status
    await prisma.emailAccount.update({
      where: { id: emailAccountId },
      data: { 
        status: 'connected',
        updatedAt: new Date()
      }
    });

    // Trigger AI analysis for recently synced threads
    try {
      const recentThreads = await prisma.emailThread.findMany({
        where: {
          orgId,
          accountId: emailAccountId,
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
          }
        },
        select: { id: true }
      });

      if (recentThreads.length > 0) {
        console.log(`[worker] Found ${recentThreads.length} recent threads to analyze`);
        
        // Process threads for AI analysis asynchronously
        for (const thread of recentThreads.slice(0, 5)) { // Limit to 5 recent threads
          try {
            await emailWorkflowService.processEmailThread(orgId, thread.id);
            console.log(`[worker] Processed thread ${thread.id} for AI analysis`);
          } catch (workflowError) {
            console.error(`[worker] Failed to process thread ${thread.id}:`, workflowError);
          }
        }
      }
    } catch (analysisError) {
      console.error(`[worker] Failed to trigger AI analysis for ${emailAccountId}:`, analysisError);
    }

    console.log(`[worker] Successfully synced ${emailAccount.provider} account ${emailAccountId}`);

  } catch (error) {
    console.error(`[worker] Email sync failed for ${emailAccountId}:`, error);
    
    // Update account status on error
    await prisma.emailAccount.update({
      where: { id: emailAccountId },
      data: { 
        status: 'action_needed',
        updatedAt: new Date()
      }
    }).catch(() => {}); // Ignore update errors
    
    throw error;
  }
}

export function startEmailSyncWorker() {
  const worker = new Worker("email-sync", processJob, getConnection());
  
  worker.on('failed', (job, err) => {
    console.error('[worker] email-sync failed', job?.id, err);
  });
  
  worker.on('completed', (job) => {
    console.log('[worker] email-sync completed', job.id);
  });
  
  return worker;
}
