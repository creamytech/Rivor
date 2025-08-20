import { startEmailBackfillWorker } from './emailBackfillWorker';
import { startCalendarSyncWorker } from './calendarSyncWorker';
import { startEmailSyncWorker } from './emailSyncWorker';
import { logger } from '@/lib/logger';

export function startAllWorkers() {
  try {
    // Start email workers
    const emailBackfillWorker = startEmailBackfillWorker();
    const emailSyncWorker = startEmailSyncWorker();
    
    // Start calendar workers
    const calendarSyncWorker = startCalendarSyncWorker();
    
    logger.info('All workers started successfully', {
      workers: ['emailBackfill', 'emailSync', 'calendarSync'],
      action: 'workers_started'
    });
    
    return {
      emailBackfillWorker,
      emailSyncWorker,
      calendarSyncWorker
    };
  } catch (error) {
    logger.error('Failed to start workers', {
      error: error instanceof Error ? error.message : String(error),
      action: 'workers_start_failed'
    });
    // Don't throw error to prevent build failures
    return null;
  }
}

// Auto-start workers when this module is imported
if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  // Only start workers on the server side and not during build
  try {
    startAllWorkers();
  } catch (error) {
    // Silently handle errors during build time
    console.warn('Workers not started:', error instanceof Error ? error.message : String(error));
  }
}
