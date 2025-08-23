/**
 * Queue optimization utilities to reduce Redis commands
 * Implements batching, connection reuse, and intelligent job scheduling
 */

interface BatchJob {
  id: string;
  type: 'email-sync' | 'calendar-sync' | 'health-probe';
  data: any;
  orgId: string;
  priority: number;
}

interface QueueBatch {
  jobs: BatchJob[];
  timestamp: number;
}

class QueueOptimizer {
  private batches = new Map<string, QueueBatch>();
  private batchFlushInterval: NodeJS.Timeout;
  private readonly BATCH_SIZE = 5;
  private readonly BATCH_TIMEOUT = 10000; // 10 seconds

  constructor() {
    // Flush batches periodically
    this.batchFlushInterval = setInterval(() => {
      this.flushExpiredBatches();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Add a job to a batch instead of immediately enqueuing
   */
  addToBatch(
    type: BatchJob['type'], 
    data: any, 
    orgId: string, 
    priority: number = 0
  ): void {
    const batchKey = `${type}:${orgId}`;
    
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, {
        jobs: [],
        timestamp: Date.now()
      });
    }

    const batch = this.batches.get(batchKey)!;
    const jobId = `${type}-${orgId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    batch.jobs.push({
      id: jobId,
      type,
      data,
      orgId,
      priority
    });

    // Flush if batch is full
    if (batch.jobs.length >= this.BATCH_SIZE) {
      this.flushBatch(batchKey);
    }
  }

  /**
   * Flush a specific batch
   */
  private async flushBatch(batchKey: string): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.jobs.length === 0) return;

    try {
      // Sort jobs by priority
      const sortedJobs = batch.jobs.sort((a, b) => b.priority - a.priority);
      
      // Process the batch based on job type
      const firstJob = sortedJobs[0];
      
      switch (firstJob.type) {
        case 'email-sync':
          await this.processBatchedEmailSync(sortedJobs);
          break;
        case 'calendar-sync':
          await this.processBatchedCalendarSync(sortedJobs);
          break;
        case 'health-probe':
          await this.processBatchedHealthProbe(sortedJobs);
          break;
      }

      console.log(`[QueueOptimizer] Flushed batch ${batchKey} with ${batch.jobs.length} jobs`);
    } catch (error) {
      console.error(`[QueueOptimizer] Error flushing batch ${batchKey}:`, error);
    } finally {
      // Clear the batch
      this.batches.delete(batchKey);
    }
  }

  /**
   * Flush expired batches
   */
  private flushExpiredBatches(): void {
    const now = Date.now();
    const expiredBatches: string[] = [];

    for (const [batchKey, batch] of this.batches.entries()) {
      if (now - batch.timestamp > this.BATCH_TIMEOUT) {
        expiredBatches.push(batchKey);
      }
    }

    expiredBatches.forEach(batchKey => {
      this.flushBatch(batchKey);
    });
  }

  /**
   * Process batched email sync jobs
   */
  private async processBatchedEmailSync(jobs: BatchJob[]): Promise<void> {
    // Import here to avoid circular dependencies
    const { getEmailSyncQueue } = await import('@/server/queue');
    const queue = getEmailSyncQueue();

    // Create a single batch job that processes multiple accounts
    await queue.add('batch-sync', {
      accountIds: jobs.map(job => job.data.emailAccountId),
      orgIds: jobs.map(job => job.orgId),
      batchId: `batch-${Date.now()}`
    }, {
      attempts: 2,
      removeOnComplete: 3,
      removeOnFail: 2,
      // Use batch ID for deduplication
      jobId: `batch-email-sync-${jobs[0].orgId}-${Date.now()}`
    });
  }

  /**
   * Process batched calendar sync jobs
   */
  private async processBatchedCalendarSync(jobs: BatchJob[]): Promise<void> {
    const { getCalendarSyncQueue } = await import('@/server/queue');
    const queue = getCalendarSyncQueue();

    await queue.add('batch-sync', {
      accountIds: jobs.map(job => job.data.calendarAccountId),
      orgIds: jobs.map(job => job.orgId),
      batchId: `batch-${Date.now()}`
    }, {
      attempts: 2,
      removeOnComplete: 3,
      removeOnFail: 2,
      jobId: `batch-calendar-sync-${jobs[0].orgId}-${Date.now()}`
    });
  }

  /**
   * Process batched health probe jobs
   */
  private async processBatchedHealthProbe(jobs: BatchJob[]): Promise<void> {
    const { getHealthProbeQueue } = await import('@/server/queue');
    const queue = getHealthProbeQueue();

    await queue.add('batch-probe', {
      orgIds: [...new Set(jobs.map(job => job.orgId))], // Deduplicate orgIds
      probeTypes: jobs.map(job => job.data.probeType),
      batchId: `batch-${Date.now()}`
    }, {
      attempts: 1, // Health probes don't need retries
      removeOnComplete: 1,
      removeOnFail: 1,
      jobId: `batch-health-probe-${Date.now()}`
    });
  }

  /**
   * Get statistics about current batches
   */
  getBatchStats() {
    const stats = {
      activeBatches: this.batches.size,
      totalQueuedJobs: 0,
      batchesByType: {} as Record<string, number>
    };

    for (const [batchKey, batch] of this.batches.entries()) {
      const type = batchKey.split(':')[0];
      stats.totalQueuedJobs += batch.jobs.length;
      stats.batchesByType[type] = (stats.batchesByType[type] || 0) + batch.jobs.length;
    }

    return stats;
  }

  /**
   * Force flush all batches (useful for shutdown)
   */
  async flushAll(): Promise<void> {
    const batchKeys = Array.from(this.batches.keys());
    await Promise.all(batchKeys.map(key => this.flushBatch(key)));
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.batchFlushInterval) {
      clearInterval(this.batchFlushInterval);
    }
    this.flushAll(); // Don't await to avoid blocking shutdown
    this.batches.clear();
  }
}

// Singleton instance
const queueOptimizer = new QueueOptimizer();

export default queueOptimizer;

/**
 * Helper functions for easy batching
 */
export const batchQueue = {
  emailSync: (orgId: string, emailAccountId: string, priority: number = 0) => {
    queueOptimizer.addToBatch('email-sync', { emailAccountId }, orgId, priority);
  },

  calendarSync: (orgId: string, calendarAccountId: string, priority: number = 0) => {
    queueOptimizer.addToBatch('calendar-sync', { calendarAccountId }, orgId, priority);
  },

  healthProbe: (orgId: string, probeType: string, priority: number = 0) => {
    queueOptimizer.addToBatch('health-probe', { probeType }, orgId, priority);
  },

  stats: () => queueOptimizer.getBatchStats(),
  flushAll: () => queueOptimizer.flushAll()
};

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('[QueueOptimizer] Received SIGTERM, flushing batches...');
  queueOptimizer.destroy();
});

process.on('SIGINT', () => {
  console.log('[QueueOptimizer] Received SIGINT, flushing batches...');
  queueOptimizer.destroy();
});