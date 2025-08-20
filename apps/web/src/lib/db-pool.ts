// Database connection pooling for better performance
import { PrismaClient } from '@prisma/client';

interface GlobalForPrisma {
  prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as unknown as GlobalForPrisma;

// Create Prisma client instance with safe initialization
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// Export the Prisma client with lazy initialization
export const prisma = (() => {
  // Skip initialization during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return new Proxy({}, {
      get() {
        throw new Error('Prisma client cannot be used during build time');
      }
    }) as PrismaClient;
  }

  // Use global instance in development to prevent hot-reload issues
  if (process.env.NODE_ENV !== 'production') {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return globalForPrisma.prisma;
  }

  // Create new instance in production
  return createPrismaClient();
})();

// Optimized transaction helper with retries
export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(callback, {
        maxWait: 10000, // 10 seconds
        timeout: 30000, // 30 seconds
      });
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain types of errors
      if (error instanceof Error) {
        if (error.message.includes('unique constraint') || 
            error.message.includes('foreign key constraint')) {
          throw error;
        }
      }
      
      // Exponential backoff for retries
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Connection health check
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    
    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Cleanup function for graceful shutdowns
export async function cleanup(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.warn('Error disconnecting Prisma client:', error);
  }
}