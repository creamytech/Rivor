import { prisma } from "./db";
import { logger } from "@/lib/logger";

interface SessionSyncResult {
  success: boolean;
  sessionCount: number;
  updatedSessions: number;
}

/**
 * Synchronizes sessions across devices for the same user
 * This ensures that when a user signs in on one device,
 * their other devices will sync quickly
 */
export async function syncUserSessions(userId: string, triggerSessionToken?: string): Promise<SessionSyncResult> {
  try {
    // Get all active sessions for this user
    const userSessions = await prisma.session.findMany({
      where: { 
        userId,
        expires: { gt: new Date() } // Only active sessions
      },
      select: {
        sessionToken: true,
        expires: true,
        userId: true
      }
    });

    if (userSessions.length === 0) {
      return {
        success: true,
        sessionCount: 0,
        updatedSessions: 0
      };
    }

    // Update the expires time of other sessions to force refresh on other devices
    const now = new Date();
    const fastSyncExpiration = new Date(now.getTime() + (2 * 60 * 1000)); // 2 minutes from now

    // Update all sessions except the triggering one to force refresh
    const sessionsToUpdate = userSessions
      .filter(session => session.sessionToken !== triggerSessionToken)
      .map(session => session.sessionToken);

    let updatedCount = 0;
    if (sessionsToUpdate.length > 0) {
      // Use updateMany for efficiency
      const updateResult = await prisma.session.updateMany({
        where: {
          sessionToken: { in: sessionsToUpdate },
          expires: { gt: now } // Only update non-expired sessions
        },
        data: {
          // Reduce expires time to force faster refresh on other devices
          expires: fastSyncExpiration
        }
      });
      
      updatedCount = updateResult.count;
    }

    logger.info('Session sync completed', {
      userId,
      totalSessions: userSessions.length,
      updatedSessions: updatedCount,
      triggerSession: triggerSessionToken?.substring(0, 10) + '...'
    });

    return {
      success: true,
      sessionCount: userSessions.length,
      updatedSessions: updatedCount
    };

  } catch (error) {
    logger.error('Session sync failed', {
      userId,
      error: error?.message || error
    });
    
    return {
      success: false,
      sessionCount: 0,
      updatedSessions: 0
    };
  }
}

/**
 * Clean up expired sessions to prevent database bloat
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expires: { lt: new Date() }
      }
    });

    if (result.count > 0) {
      logger.info('Cleaned up expired sessions', { deletedCount: result.count });
    }

    return result.count;
  } catch (error) {
    logger.error('Session cleanup failed', { error: error?.message || error });
    return 0;
  }
}

/**
 * Get session status for monitoring
 */
export async function getSessionStats(): Promise<{
  totalActiveSessions: number;
  uniqueActiveUsers: number;
  expiredSessions: number;
}> {
  try {
    const now = new Date();
    
    const [activeCount, uniqueUsers, expiredCount] = await Promise.all([
      prisma.session.count({
        where: { expires: { gt: now } }
      }),
      prisma.session.groupBy({
        by: ['userId'],
        where: { expires: { gt: now } },
        _count: { userId: true }
      }).then(groups => groups.length),
      prisma.session.count({
        where: { expires: { lt: now } }
      })
    ]);

    return {
      totalActiveSessions: activeCount,
      uniqueActiveUsers: uniqueUsers,
      expiredSessions: expiredCount
    };
  } catch (error) {
    logger.error('Session stats failed', { error: error?.message || error });
    return {
      totalActiveSessions: 0,
      uniqueActiveUsers: 0,
      expiredSessions: 0
    };
  }
}