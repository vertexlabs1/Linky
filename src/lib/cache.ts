interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache stats for debugging
  getStats() {
    const entries = Array.from(this.cache.entries());
    return {
      size: entries.length,
      keys: entries.map(([key]) => key),
      entries: entries.map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        expired: Date.now() - entry.timestamp > entry.ttl
      }))
    };
  }
}

// Create a singleton cache instance
export const cache = new Cache();

// Cache keys
export const CACHE_KEYS = {
  ADMIN_DASHBOARD: 'admin_dashboard_data',
  USER_PROFILE: 'user_profile',
  EMAIL_TEMPLATES: 'email_templates',
  WAITLIST_DATA: 'waitlist_data',
  FOUNDING_MEMBERS: 'founding_members',
} as const;

// Cache utilities
export const withCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  const cached = cache.get<T>(key);
  if (cached) {
    return cached;
  }

  const data = await fetcher();
  cache.set(key, data, ttl);
  return data;
};

export const invalidateCache = (pattern?: string) => {
  if (!pattern) {
    cache.clear();
    return;
  }

  const keys = Array.from(cache['cache'].keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}; 