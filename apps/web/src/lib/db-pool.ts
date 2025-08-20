// Database connection pooling for better performance
import { PrismaClient } from '@prisma/client';

interface GlobalForPrisma {
  prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as unknown as GlobalForPrisma;

// Create a single Prisma instance with optimized settings
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool configuration for better performance
  __internal: {
    engine: {
      // Optimize connection pooling
      connectionString: process.env.DATABASE_URL,
      connectionPoolTimeout: 20000, // 20 seconds
      connectionPoolSize: 10, // Limit connections for Vercel
      connectionTimeout: 30000, // 30 seconds
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

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
        isolationLevel: 'ReadCommitted', // Better for high concurrency
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

// Optimized bulk operations
export async function bulkUpsert<T extends Record<string, any>>(
  model: any,
  data: T[],
  uniqueKey: keyof T,
  batchSize = 100
): Promise<void> {
  // Process in batches to avoid memory issues
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    await prisma.$transaction(
      batch.map(item => 
        model.upsert({
          where: { [uniqueKey]: item[uniqueKey] },
          update: item,
          create: item,
        })
      ),
      {
        maxWait: 10000,
        timeout: 60000, // Longer timeout for bulk operations
      }
    );
  }
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
  await prisma.$disconnect();
}