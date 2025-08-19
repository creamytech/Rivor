import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import Redis from 'ioredis';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session as { orgId?: string }).orgId;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Test Redis connection
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    logger.info('Testing Redis connection', { redisUrl });

    const redis = new Redis(redisUrl, {
      connectTimeout: 5000,
      lazyConnect: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });

    // Test basic operations
    const testKey = `test:${orgId}:${Date.now()}`;
    const testValue = 'test-value';

    // Set a test value
    await redis.set(testKey, testValue, 'EX', 60); // Expire in 60 seconds
    
    // Get the test value
    const retrievedValue = await redis.get(testKey);
    
    // Clean up
    await redis.del(testKey);
    
    // Close connection
    await redis.quit();

    return NextResponse.json({
      success: true,
      orgId,
      redisUrl: redisUrl.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
      testKey,
      testValue,
      retrievedValue,
      connectionWorking: retrievedValue === testValue,
      message: 'Redis connection test completed successfully'
    });

  } catch (error) {
    console.error('Redis test error:', error);
    return NextResponse.json(
      {
        error: 'Failed to test Redis connection',
        details: error instanceof Error ? error.message : String(error),
        redisUrl: (process.env.REDIS_URL || 'redis://localhost:6379').replace(/\/\/.*@/, '//***:***@')
      },
      { status: 500 }
    );
  }
}
