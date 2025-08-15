import { prisma } from "./db";
import { getQueueStats } from "./queue-jobs";
import { getTokenEncryptionStatus } from "./secure-tokens";
import { logger } from "@/lib/logger";

export interface IntegrationMetrics {
  timestamp: string;
  totalOrgs: number;
  totalEmailAccounts: number;
  connectedAccounts: number;
  actionNeededAccounts: number;
  disconnectedAccounts: number;
  encryptionHealth: {
    totalTokens: number;
    okTokens: number;
    pendingTokens: number;
    failedTokens: number;
    failureRate: number;
  };
  queueHealth: {
    tokenEncryption: {
      waiting: number;
      active: number;
      failed: number;
    };
    syncInit: {
      waiting: number;
      active: number;
      failed: number;
    };
  } | null;
  healthProbeStats: {
    totalProbesLast24h: number;
    successfulProbes: number;
    failedProbes: number;
    successRate: number;
  };
  alerts: Alert[];
}

export interface Alert {
  level: 'info' | 'warning' | 'critical';
  type: string;
  message: string;
  details?: any;
  timestamp: string;
}

/**
 * Collects comprehensive metrics for integration health monitoring
 */
export async function collectIntegrationMetrics(): Promise<IntegrationMetrics> {
  const timestamp = new Date().toISOString();
  const alerts: Alert[] = [];

  try {
    // Basic counts
    const [totalOrgs, emailAccountStats] = await Promise.all([
      prisma.org.count(),
      prisma.emailAccount.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ]);

    const totalEmailAccounts = emailAccountStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const connectedAccounts = emailAccountStats.find(s => s.status === 'connected')?._count.id || 0;
    const actionNeededAccounts = emailAccountStats.find(s => s.status === 'action_needed')?._count.id || 0;
    const disconnectedAccounts = emailAccountStats.find(s => s.status === 'disconnected')?._count.id || 0;

    // Encryption health across all orgs
    const allOrgs = await prisma.org.findMany({ select: { id: true } });
    const encryptionHealth = {
      totalTokens: 0,
      okTokens: 0,
      pendingTokens: 0,
      failedTokens: 0,
      failureRate: 0,
    };

    for (const org of allOrgs) {
      const orgStats = await getTokenEncryptionStatus(org.id);
      encryptionHealth.totalTokens += orgStats.totalTokens;
      encryptionHealth.okTokens += orgStats.okTokens;
      encryptionHealth.pendingTokens += orgStats.pendingTokens;
      encryptionHealth.failedTokens += orgStats.failedTokens;
    }

    if (encryptionHealth.totalTokens > 0) {
      encryptionHealth.failureRate = encryptionHealth.failedTokens / encryptionHealth.totalTokens;
    }

    // Queue health
    const queueHealth = await getQueueStats();

    // Health probe statistics (last 24 hours)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [successfulProbes, failedProbes] = await Promise.all([
      prisma.auditLog.count({
        where: {
          action: 'health_probe',
          success: true,
          createdAt: { gte: last24h }
        }
      }),
      prisma.auditLog.count({
        where: {
          action: 'health_probe',
          success: false,
          createdAt: { gte: last24h }
        }
      })
    ]);

    const totalProbesLast24h = successfulProbes + failedProbes;
    const successRate = totalProbesLast24h > 0 ? successfulProbes / totalProbesLast24h : 0;

    const healthProbeStats = {
      totalProbesLast24h,
      successfulProbes,
      failedProbes,
      successRate,
    };

    // Generate alerts based on metrics
    generateAlerts(alerts, {
      encryptionHealth,
      queueHealth,
      healthProbeStats,
      connectedAccounts,
      totalEmailAccounts,
    });

    const metrics: IntegrationMetrics = {
      timestamp,
      totalOrgs,
      totalEmailAccounts,
      connectedAccounts,
      actionNeededAccounts,
      disconnectedAccounts,
      encryptionHealth,
      queueHealth,
      healthProbeStats,
      alerts,
    };

    // Log metrics for observability
    logger.info('Integration metrics collected', {
      metrics: {
        totalOrgs,
        totalEmailAccounts,
        connectedAccounts,
        encryptionFailureRate: encryptionHealth.failureRate,
        healthProbeSuccessRate: successRate,
        alertCount: alerts.length,
      }
    });

    return metrics;

  } catch (error: any) {
    logger.error('Failed to collect integration metrics', { error: error?.message || error });
    
    // Return minimal metrics with error alert
    return {
      timestamp,
      totalOrgs: 0,
      totalEmailAccounts: 0,
      connectedAccounts: 0,
      actionNeededAccounts: 0,
      disconnectedAccounts: 0,
      encryptionHealth: {
        totalTokens: 0,
        okTokens: 0,
        pendingTokens: 0,
        failedTokens: 0,
        failureRate: 0,
      },
      queueHealth: null,
      healthProbeStats: {
        totalProbesLast24h: 0,
        successfulProbes: 0,
        failedProbes: 0,
        successRate: 0,
      },
      alerts: [{
        level: 'critical',
        type: 'metrics_collection_failed',
        message: 'Failed to collect integration metrics',
        details: { error: error?.message || error },
        timestamp,
      }],
    };
  }
}

/**
 * Generates alerts based on collected metrics
 */
function generateAlerts(alerts: Alert[], data: {
  encryptionHealth: any;
  queueHealth: any;
  healthProbeStats: any;
  connectedAccounts: number;
  totalEmailAccounts: number;
}): void {
  const timestamp = new Date().toISOString();

  // KMS failure rate alert
  if (data.encryptionHealth.failureRate > 0.1) { // More than 10% failure rate
    alerts.push({
      level: data.encryptionHealth.failureRate > 0.5 ? 'critical' : 'warning',
      type: 'high_kms_failure_rate',
      message: `High token encryption failure rate: ${(data.encryptionHealth.failureRate * 100).toFixed(1)}%`,
      details: {
        failedTokens: data.encryptionHealth.failedTokens,
        totalTokens: data.encryptionHealth.totalTokens,
      },
      timestamp,
    });
  }

  // Dead letter queue alert
  if (data.queueHealth?.tokenEncryption.failed > 5) {
    alerts.push({
      level: 'critical',
      type: 'dead_letter_jobs',
      message: `${data.queueHealth.tokenEncryption.failed} token encryption jobs permanently failed`,
      details: {
        failedJobs: data.queueHealth.tokenEncryption.failed,
      },
      timestamp,
    });
  }

  // Health probe failure alert
  if (data.healthProbeStats.successRate < 0.9 && data.healthProbeStats.totalProbesLast24h > 10) {
    alerts.push({
      level: data.healthProbeStats.successRate < 0.7 ? 'critical' : 'warning',
      type: 'health_probe_failures',
      message: `Low health probe success rate: ${(data.healthProbeStats.successRate * 100).toFixed(1)}%`,
      details: {
        successfulProbes: data.healthProbeStats.successfulProbes,
        totalProbes: data.healthProbeStats.totalProbesLast24h,
      },
      timestamp,
    });
  }

  // Queue backlog alert
  if (data.queueHealth?.tokenEncryption.waiting > 50) {
    alerts.push({
      level: 'warning',
      type: 'queue_backlog',
      message: `Large token encryption queue backlog: ${data.queueHealth.tokenEncryption.waiting} jobs waiting`,
      details: {
        waitingJobs: data.queueHealth.tokenEncryption.waiting,
      },
      timestamp,
    });
  }

  // Low connection rate alert
  if (data.totalEmailAccounts > 0) {
    const connectionRate = data.connectedAccounts / data.totalEmailAccounts;
    if (connectionRate < 0.8) {
      alerts.push({
        level: connectionRate < 0.5 ? 'critical' : 'warning',
        type: 'low_connection_rate',
        message: `Low account connection rate: ${(connectionRate * 100).toFixed(1)}%`,
        details: {
          connectedAccounts: data.connectedAccounts,
          totalAccounts: data.totalEmailAccounts,
        },
        timestamp,
      });
    }
  }
}

/**
 * Logs structured events for OAuth callbacks as required by Milestone 7
 */
export function logOAuthCallbackSummary(data: {
  userId: string;
  provider: string;
  externalAccountId: string;
  orgCreated: boolean;
  emailAccountUpserted: boolean;
  kmsStatus: 'ok' | 'failed' | 'fallback';
  success: boolean;
  errors?: string[];
}): void {
  logger.info('OAuth callback summary', {
    userId: data.userId,
    provider: data.provider,
    externalAccountId: data.externalAccountId,
    orgCreated: data.orgCreated,
    emailAccountUpserted: data.emailAccountUpserted,
    kmsStatus: data.kmsStatus,
    success: data.success,
    errors: data.errors,
    action: 'oauth_callback_summary',
  });
}

/**
 * Logs KMS failures with error classification
 */
export function logKmsFailure(data: {
  orgId: string;
  operation: 'encrypt' | 'decrypt';
  errorClass: string;
  errorCode?: string;
  retryCount?: number;
}): void {
  logger.error('KMS operation failed', {
    orgId: data.orgId,
    operation: data.operation,
    errorClass: data.errorClass,
    errorCode: data.errorCode,
    retryCount: data.retryCount,
    action: 'kms_failure',
  });
}

/**
 * Logs health probe results
 */
export function logHealthProbe(data: {
  emailAccountId: string;
  gmail: 'ok' | 'fail';
  calendar?: 'ok' | 'fail';
  reason?: string;
  duration?: number;
}): void {
  logger.info('Health probe completed', {
    emailAccountId: data.emailAccountId,
    gmail: data.gmail,
    calendar: data.calendar,
    reason: data.reason,
    duration: data.duration,
    action: 'health_probe',
  });

  // Also log to audit table for metrics
  prisma.auditLog.create({
    data: {
      orgId: 'system', // System-level audit
      action: 'health_probe',
      resource: data.emailAccountId,
      success: data.gmail === 'ok',
      purpose: data.reason,
    }
  }).catch(error => {
    logger.warn('Failed to log health probe to audit table', { error });
  });
}

/**
 * Creates an API endpoint response for metrics
 */
export async function getMetricsForApi() {
  const metrics = await collectIntegrationMetrics();
  
  // Send alerts to external monitoring if configured
  if (metrics.alerts.length > 0) {
    await sendAlertsToMonitoring(metrics.alerts);
  }
  
  return {
    ...metrics,
    // Add additional computed metrics for dashboards
    computed: {
      accountHealthScore: calculateAccountHealthScore(metrics),
      encryptionHealthScore: calculateEncryptionHealthScore(metrics.encryptionHealth),
      overallHealthScore: calculateOverallHealthScore(metrics),
    }
  };
}

function calculateAccountHealthScore(metrics: IntegrationMetrics): number {
  if (metrics.totalEmailAccounts === 0) return 1;
  return metrics.connectedAccounts / metrics.totalEmailAccounts;
}

function calculateEncryptionHealthScore(encryptionHealth: any): number {
  if (encryptionHealth.totalTokens === 0) return 1;
  return encryptionHealth.okTokens / encryptionHealth.totalTokens;
}

function calculateOverallHealthScore(metrics: IntegrationMetrics): number {
  const accountScore = calculateAccountHealthScore(metrics);
  const encryptionScore = calculateEncryptionHealthScore(metrics.encryptionHealth);
  const probeScore = metrics.healthProbeStats.successRate;
  
  // Weighted average: accounts 40%, encryption 30%, probes 30%
  return (accountScore * 0.4) + (encryptionScore * 0.3) + (probeScore * 0.3);
}

/**
 * Sends alerts to external monitoring systems
 */
async function sendAlertsToMonitoring(alerts: Alert[]): Promise<void> {
  // This would integrate with your monitoring system (Sentry, PagerDuty, etc.)
  for (const alert of alerts) {
    logger.warn(`ALERT: ${alert.type}`, {
      level: alert.level,
      message: alert.message,
      details: alert.details,
      alertType: alert.type,
    });
    
    // Example: Send to Sentry
    if (typeof window === 'undefined' && alert.level === 'critical') {
      // Server-side only
      try {
        // Sentry.captureMessage(alert.message, 'error');
      } catch (error: any) {
        logger.error('Failed to send alert to Sentry', { error: error?.message || error });
      }
    }
  }
}
