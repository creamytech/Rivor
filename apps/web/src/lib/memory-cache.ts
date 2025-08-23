/**
 * In-memory cache to reduce Redis and database calls
 * Use this for frequently accessed, non-sensitive data that can be cached for short periods
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
    
    if (toDelete.length > 0) {
      console.log(`[MemoryCache] Cleaned up ${toDelete.length} expired entries`);
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRatio: validEntries / Math.max(this.cache.size, 1)
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Singleton instance
const memoryCache = new MemoryCache();

// Helper functions with common TTL values
export const cache = {
  // Short-term cache (1 minute) - for frequently changing data
  setShort: <T>(key: string, data: T) => memoryCache.set(key, data, 60 * 1000),
  
  // Medium-term cache (5 minutes) - for moderately changing data
  setMedium: <T>(key: string, data: T) => memoryCache.set(key, data, 5 * 60 * 1000),
  
  // Long-term cache (30 minutes) - for rarely changing data
  setLong: <T>(key: string, data: T) => memoryCache.set(key, data, 30 * 60 * 1000),
  
  // Get from cache
  get: <T>(key: string) => memoryCache.get<T>(key),
  
  // Delete from cache
  delete: (key: string) => memoryCache.delete(key),
  
  // Check if key exists and is valid
  has: (key: string) => memoryCache.has(key),
  
  // Clear all cache
  clear: () => memoryCache.clear(),
  
  // Get cache statistics
  stats: () => memoryCache.getStats(),

  // Set with custom TTL
  set: <T>(key: string, data: T, ttlMs: number) => memoryCache.set(key, data, ttlMs)
};

export default memoryCache;

// Cache key generators for consistent naming
export const cacheKeys = {
  userSettings: (userId: string) => `user_settings:${userId}`,
  integrationStatus: (orgId: string) => `integration_status:${orgId}`,
  systemHealth: () => 'system_health',
  orgStats: (orgId: string) => `org_stats:${orgId}`,
  emailCount: (orgId: string) => `email_count:${orgId}`,
  calendarEvents: (orgId: string) => `calendar_events:${orgId}`,
  syncStatus: (orgId: string) => `sync_status:${orgId}`
};