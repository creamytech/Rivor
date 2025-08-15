import { prisma } from "./db";
import { getTokensSecurely } from "./secure-tokens";
import { logger } from "@/lib/logger";
import { logHealthProbe } from "./monitoring";

export interface HealthProbeResult {
  emailAccountId: string;
  provider: string;
  gmail?: {
    status: 'ok' | 'fail';
    reason?: string;
  };
  calendar?: {
    status: 'ok' | 'fail';
    reason?: string;
  };
  overallStatus: 'connected' | 'action_needed' | 'disconnected';
  probeAt: Date;
}

/**
 * Runs health probes for email accounts to check token validity and permissions
 */
export async function runHealthProbe(emailAccountId: string): Promise<HealthProbeResult> {
  const probeAt = new Date();
  const result: HealthProbeResult = {
    emailAccountId,
    provider: '',
    overallStatus: 'disconnected',
    probeAt,
  };

  try {
    // Get email account
    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId },
      select: {
        id: true,
        orgId: true,
        provider: true,
        status: true,
        encryptionStatus: true,
        tokenRef: true,
        historyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!emailAccount) {
      throw new Error('EmailAccount not found');
    }

    result.provider = emailAccount.provider;

    // Check encryption status first
    if (emailAccount.encryptionStatus !== 'ok' || !emailAccount.tokenRef) {
      result.overallStatus = 'action_needed';
      result.gmail = { status: 'fail', reason: 'Token encryption failed or missing' };
      return result;
    }

    // Get tokens
    const tokens = await getTokensSecurely([emailAccount.tokenRef]);
    if (!tokens.accessToken) {
      result.overallStatus = 'action_needed';
      result.gmail = { status: 'fail', reason: 'Access token not available' };
      return result;
    }

    // Check token expiration
    if (tokens.expiresAt && tokens.expiresAt < new Date()) {
      result.overallStatus = 'action_needed';
      result.gmail = { status: 'fail', reason: 'Access token expired' };
      return result;
    }

    // Run provider-specific probes
    if (emailAccount.provider === 'google') {
      await runGoogleHealthProbes(tokens.accessToken, result);
    } else if (emailAccount.provider === 'microsoft') {
      await runMicrosoftHealthProbes(tokens.accessToken, result);
    }

    // Determine overall status
    const gmailOk = result.gmail?.status === 'ok';
    const calendarOk = result.calendar?.status === 'ok' || !result.calendar; // Calendar is optional

    if (gmailOk && calendarOk) {
      result.overallStatus = 'connected';
    } else {
      result.overallStatus = 'action_needed';
    }

    // Update EmailAccount status based on probe results
    await prisma.emailAccount.update({
      where: { id: emailAccountId },
      data: {
        status: result.overallStatus,
        errorReason: result.overallStatus === 'action_needed' 
          ? `Health probe failed: ${result.gmail?.reason || result.calendar?.reason}`
          : null,
      },
    });

    // Use structured logging for health probe results
    logHealthProbe({
      emailAccountId,
      gmail: result.gmail?.status || 'fail',
      calendar: result.calendar?.status,
      reason: result.gmail?.reason || result.calendar?.reason,
      duration: Date.now() - probeAt.getTime(),
    });

    logger.info('Health probe completed', {
      emailAccountId,
      provider: result.provider,
      overallStatus: result.overallStatus,
    });

    return result;

  } catch (error: unknown) {
    result.overallStatus = 'disconnected';
    result.gmail = { status: 'fail', reason: error?.message || 'Health probe failed' };

    logger.error('Health probe failed', {
      emailAccountId,
      error: error?.message || error,
    });

    // Update EmailAccount with error
    try {
      await prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: {
          status: 'disconnected',
          errorReason: `Health probe error: ${error?.message || error}`,
        },
      });
    } catch (updateError: unknown) {
      logger.error('Failed to update EmailAccount after probe failure', {
        emailAccountId,
        updateError: updateError?.message || updateError,
      });
    }

    return result;
  }
}

/**
 * Runs Google-specific health probes
 */
async function runGoogleHealthProbes(accessToken: string, result: HealthProbeResult): Promise<void> {
  // Gmail API probe - lightweight profile check
  try {
    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (gmailResponse.ok) {
      result.gmail = { status: 'ok' };
    } else if (gmailResponse.status === 401) {
      result.gmail = { status: 'fail', reason: 'Invalid or expired token' };
    } else if (gmailResponse.status === 403) {
      result.gmail = { status: 'fail', reason: 'Insufficient Gmail permissions' };
    } else {
      result.gmail = { status: 'fail', reason: `Gmail API error: ${gmailResponse.status}` };
    }
  } catch (error: unknown) {
    result.gmail = { status: 'fail', reason: `Gmail probe error: ${error?.message || error}` };
  }

  // Calendar API probe - list calendars
  try {
    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (calendarResponse.ok) {
      result.calendar = { status: 'ok' };
    } else if (calendarResponse.status === 401) {
      result.calendar = { status: 'fail', reason: 'Invalid or expired token' };
    } else if (calendarResponse.status === 403) {
      result.calendar = { status: 'fail', reason: 'Insufficient Calendar permissions' };
    } else {
      result.calendar = { status: 'fail', reason: `Calendar API error: ${calendarResponse.status}` };
    }
  } catch (error: unknown) {
    result.calendar = { status: 'fail', reason: `Calendar probe error: ${error?.message || error}` };
  }
}

/**
 * Runs Microsoft-specific health probes
 */
async function runMicrosoftHealthProbes(accessToken: string, result: HealthProbeResult): Promise<void> {
  // Microsoft Graph Mail probe
  try {
    const mailResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (mailResponse.ok) {
      result.gmail = { status: 'ok' }; // Using gmail field for email probe
    } else if (mailResponse.status === 401) {
      result.gmail = { status: 'fail', reason: 'Invalid or expired token' };
    } else if (mailResponse.status === 403) {
      result.gmail = { status: 'fail', reason: 'Insufficient Mail permissions' };
    } else {
      result.gmail = { status: 'fail', reason: `Mail API error: ${mailResponse.status}` };
    }
  } catch (error: unknown) {
    result.gmail = { status: 'fail', reason: `Mail probe error: ${error?.message || error}` };
  }

  // Microsoft Graph Calendar probe
  try {
    const calendarResponse = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (calendarResponse.ok) {
      result.calendar = { status: 'ok' };
    } else if (calendarResponse.status === 401) {
      result.calendar = { status: 'fail', reason: 'Invalid or expired token' };
    } else if (calendarResponse.status === 403) {
      result.calendar = { status: 'fail', reason: 'Insufficient Calendar permissions' };
    } else {
      result.calendar = { status: 'fail', reason: `Calendar API error: ${calendarResponse.status}` };
    }
  } catch (error: unknown) {
    result.calendar = { status: 'fail', reason: `Calendar probe error: ${error?.message || error}` };
  }
}

/**
 * Runs health probes for all email accounts in an organization
 */
export async function runOrgHealthProbes(orgId: string): Promise<HealthProbeResult[]> {
  const emailAccounts = await prisma.emailAccount.findMany({
    where: { orgId },
    select: { id: true },
  });

  const results = await Promise.allSettled(
    emailAccounts.map(account => runHealthProbe(account.id))
  );

  const successfulResults = results
    .filter((result): result is PromiseFulfilledResult<HealthProbeResult> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);

  const failedResults = results
    .filter((result): result is PromiseRejectedResult => 
      result.status === 'rejected'
    );

  if (failedResults.length > 0) {
    logger.warn('Some health probes failed', {
      orgId,
      failedCount: failedResults.length,
      totalCount: emailAccounts.length,
    });
  }

  return successfulResults;
}

/**
 * Schedules periodic health probes for all accounts
 */
export async function scheduleHealthProbes(): Promise<void> {
  try {
    const { getHealthProbeQueue } = await import("./queue");
    const queue = getHealthProbeQueue();

    // Get all active email accounts
    const emailAccounts = await prisma.emailAccount.findMany({
      where: {
        status: { in: ['connected', 'action_needed'] },
        encryptionStatus: 'ok',
      },
      select: { id: true, orgId: true, provider: true },
    });

    // Schedule health probes with staggered timing
    for (let i = 0; i < emailAccounts.length; i++) {
      const account = emailAccounts[i];
      const delay = i * 1000; // Stagger by 1 second each

      await queue.add(
        'health-probe',
        { emailAccountId: account.id },
        {
          delay,
          attempts: 2,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 5,
          removeOnFail: 3,
        }
      );
    }

    logger.info('Scheduled health probes', {
      accountCount: emailAccounts.length,
    });

  } catch (error: unknown) {
    logger.error('Failed to schedule health probes', { error: error?.message || error });
  }
}