import { logger } from '@/lib/logger';
import { internalFetch } from '@/lib/internal-url';
import { prisma } from '@/lib/db-pool';

interface SyncScheduleConfig {
  emailSyncIntervalMinutes: number;
  calendarSyncIntervalMinutes: number;
  enabled: boolean;
  maxConcurrentSyncs: number;
}

export class ScheduledSyncService {
  private emailIntervals: Map<string, NodeJS.Timeout> = new Map();
  private calendarIntervals: Map<string, NodeJS.Timeout> = new Map();
  private activeSyncs: Set<string> = new Set();
  
  private defaultConfig: SyncScheduleConfig = {
    emailSyncIntervalMinutes: 120, // 2 hours for email (as requested - every few hours)
    calendarSyncIntervalMinutes: 240, // 4 hours for calendar
    enabled: true,
    maxConcurrentSyncs: 3
  };

  /**
   * Start scheduled sync for all organizations
   */
  async startScheduledSync(): Promise<void> {
    try {
      logger.info('Starting scheduled sync service');

      // Get all organizations that need sync
      const orgs = await prisma.org.findMany({
        select: {
          id: true,
          name: true
        }
      });

      logger.info('Found organizations for scheduled sync', {
        orgCount: orgs.length,
        action: 'scheduled_sync_startup'
      });

      // Start sync schedule for each organization
      for (const org of orgs) {
        await this.startOrgSync(org.id);
      }

      logger.info('Scheduled sync service started for all organizations');

    } catch (error) {
      logger.error('Failed to start scheduled sync service', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Start scheduled sync for a specific organization
   */
  async startOrgSync(orgId: string): Promise<void> {
    try {
      // Stop existing sync if running
      await this.stopOrgSync(orgId);

      const config = await this.getSyncConfig(orgId);
      
      if (!config.enabled) {
        logger.info('Sync disabled for organization', { orgId });
        return;
      }

      // Set up separate intervals for email and calendar
      const emailInterval = setInterval(async () => {
        await this.executeSyncForOrg(orgId, 'email');
      }, config.emailSyncIntervalMinutes * 60 * 1000);

      const calendarInterval = setInterval(async () => {
        await this.executeSyncForOrg(orgId, 'calendar');
      }, config.calendarSyncIntervalMinutes * 60 * 1000);

      this.emailIntervals.set(orgId, emailInterval);
      this.calendarIntervals.set(orgId, calendarInterval);

      logger.info('Scheduled sync started for organization', {
        orgId,
        emailIntervalHours: config.emailSyncIntervalMinutes / 60,
        calendarIntervalHours: config.calendarSyncIntervalMinutes / 60,
        action: 'org_sync_started'
      });

      // Execute initial sync after a short delay
      setTimeout(() => {
        this.executeSyncForOrg(orgId, 'both');
      }, 30000); // 30 seconds delay

    } catch (error) {
      logger.error('Failed to start org sync', {
        orgId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Stop scheduled sync for a specific organization
   */
  async stopOrgSync(orgId: string): Promise<void> {
    const emailInterval = this.emailIntervals.get(orgId);
    const calendarInterval = this.calendarIntervals.get(orgId);
    
    if (emailInterval) {
      clearInterval(emailInterval);
      this.emailIntervals.delete(orgId);
    }
    
    if (calendarInterval) {
      clearInterval(calendarInterval);
      this.calendarIntervals.delete(orgId);
    }
    
    if (emailInterval || calendarInterval) {
      logger.info('Scheduled sync stopped for organization', { orgId });
    }
  }

  /**
   * Stop all scheduled syncs
   */
  async stopAllSyncs(): Promise<void> {
    for (const [orgId, interval] of this.emailIntervals) {
      clearInterval(interval);
      logger.info('Stopping email sync for organization', { orgId });
    }
    
    for (const [orgId, interval] of this.calendarIntervals) {
      clearInterval(interval);
      logger.info('Stopping calendar sync for organization', { orgId });
    }
    
    this.emailIntervals.clear();
    this.calendarIntervals.clear();
    this.activeSyncs.clear();
    logger.info('All scheduled syncs stopped');
  }

  /**
   * Execute sync for a specific organization
   */
  private async executeSyncForOrg(orgId: string, syncType: 'email' | 'calendar' | 'both' = 'both'): Promise<void> {
    const syncKey = `sync-${orgId}-${syncType}`;
    
    // Prevent concurrent syncs for the same org and type
    if (this.activeSyncs.has(syncKey)) {
      logger.info('Sync already in progress for organization', { 
        orgId,
        syncType,
        action: 'sync_skip_concurrent'
      });
      return;
    }

    // Check if we've exceeded max concurrent syncs
    if (this.activeSyncs.size >= this.defaultConfig.maxConcurrentSyncs) {
      logger.info('Max concurrent syncs reached, skipping', {
        orgId,
        activeSyncs: this.activeSyncs.size,
        maxConcurrent: this.defaultConfig.maxConcurrentSyncs,
        action: 'sync_skip_max_concurrent'
      });
      return;
    }

    this.activeSyncs.add(syncKey);
    const startTime = Date.now();

    try {
      logger.info('Starting scheduled sync for organization', {
        orgId,
        syncType,
        action: 'scheduled_sync_start'
      });

      // Check if org has any connected accounts before syncing
      const [emailAccountCount, calendarAccountCount] = await Promise.all([
        prisma.emailAccount.count({
          where: { 
            orgId,
            status: { in: ['connected', 'action_needed'] }
          }
        }),
        prisma.calendarAccount.count({
          where: {
            orgId,
            status: 'connected'
          }
        })
      ]);

      if (emailAccountCount === 0 && calendarAccountCount === 0) {
        logger.info('No connected accounts found, skipping sync', {
          orgId,
          action: 'sync_skip_no_accounts'
        });
        return;
      }

      // Call the auto-sync endpoint internally with proper URL handling
      const syncResponse = await internalFetch('/api/sync/auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Sync': 'true',
          'X-Org-Id': orgId
        }
      });

      const duration = Date.now() - startTime;

      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        
        logger.info('Scheduled sync completed successfully', {
          orgId,
          duration,
          result: syncResult.result,
          action: 'scheduled_sync_success'
        });

        // Trigger inbox refresh for connected clients
        await this.triggerInboxRefresh(orgId, syncResult.result as any);

      } else {
        const error = await syncResponse.text();
        logger.error('Scheduled sync failed', {
          orgId,
          duration,
          status: syncResponse.status,
          error,
          action: 'scheduled_sync_failed'
        });
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Scheduled sync error', {
        orgId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        action: 'scheduled_sync_error'
      });
    } finally {
      this.activeSyncs.delete(syncKey);
    }
  }

  /**
   * Trigger inbox refresh for all connected clients
   */
  private async triggerInboxRefresh(orgId: string, syncResult: any): Promise<void> {
    try {
      // In a real implementation, this would use WebSockets or Server-Sent Events
      // to notify connected clients. For now, we'll just log the event.
      
      logger.info('Triggering inbox refresh', {
        orgId,
        newMessages: syncResult.email?.newMessages || 0,
        newThreads: syncResult.email?.newThreads || 0,
        aiAnalyzedThreads: syncResult.email?.aiAnalyzedThreads || 0,
        leadsDetected: syncResult.email?.leadsDetected || 0,
        notifications: syncResult.email?.notifications || 0,
        action: 'inbox_refresh_trigger'
      });

      // TODO: Implement WebSocket/SSE notifications for real-time inbox refresh
      // For now, clients can poll the sync status endpoint to detect changes

    } catch (error) {
      logger.error('Failed to trigger inbox refresh', {
        orgId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get sync configuration for organization
   */
  private async getSyncConfig(orgId: string): Promise<SyncScheduleConfig> {
    try {
      // For now return default config
      // This could be extended to read from organization settings
      return this.defaultConfig;
    } catch (error) {
      logger.warn('Failed to get sync config, using defaults', {
        orgId,
        error: error instanceof Error ? error.message : String(error)
      });
      return this.defaultConfig;
    }
  }

  /**
   * Get sync status for organization
   */
  async getSyncStatus(orgId: string): Promise<{
    scheduled: boolean;
    emailScheduled: boolean;
    calendarScheduled: boolean;
    lastSync?: Date;
    nextEmailSync?: Date;
    nextCalendarSync?: Date;
    activeSyncs: number;
  }> {
    const emailScheduled = this.emailIntervals.has(orgId);
    const calendarScheduled = this.calendarIntervals.has(orgId);
    const config = await this.getSyncConfig(orgId);
    
    // Get last sync from both email and calendar accounts
    const [lastEmailSync, lastCalendarSync] = await Promise.all([
      prisma.emailAccount.findFirst({
        where: { orgId },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      }),
      prisma.calendarAccount.findFirst({
        where: { orgId },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      })
    ]);

    let nextEmailSync: Date | undefined;
    let nextCalendarSync: Date | undefined;
    
    if (emailScheduled && lastEmailSync?.updatedAt) {
      nextEmailSync = new Date(lastEmailSync.updatedAt.getTime() + (config.emailSyncIntervalMinutes * 60 * 1000));
    }
    
    if (calendarScheduled && lastCalendarSync?.updatedAt) {
      nextCalendarSync = new Date(lastCalendarSync.updatedAt.getTime() + (config.calendarSyncIntervalMinutes * 60 * 1000));
    }

    // Get the most recent sync time between email and calendar
    const lastSyncTimes = [lastEmailSync?.updatedAt, lastCalendarSync?.updatedAt].filter(Boolean);
    const lastSync = lastSyncTimes.length > 0 ? new Date(Math.max(...lastSyncTimes.map(d => d!.getTime()))) : undefined;

    return {
      scheduled: emailScheduled || calendarScheduled,
      emailScheduled,
      calendarScheduled,
      lastSync,
      nextEmailSync,
      nextCalendarSync,
      activeSyncs: this.activeSyncs.size
    };
  }

  /**
   * Update sync configuration for organization
   */
  async updateSyncConfig(orgId: string, config: Partial<SyncScheduleConfig>): Promise<void> {
    // TODO: Store config in database
    logger.info('Sync config update requested', { orgId, config });
    
    // For now, just restart the sync with new config if it's running
    if (this.intervals.has(orgId)) {
      await this.stopOrgSync(orgId);
      await this.startOrgSync(orgId);
    }
  }
}

// Global instance
export const scheduledSyncService = new ScheduledSyncService();

// Note: Service is now started through the worker system in startWorkers.ts
// This ensures proper coordination with other background services