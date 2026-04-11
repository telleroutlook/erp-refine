// src/runtime/cache.ts
// KV cache wrapper with TTL and prefix management

import type { Env } from '../types/env';

export interface CacheOptions {
  ttl?: number;  // seconds
  prefix?: string;
}

export class KVCache {
  constructor(private readonly kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    const val = await this.kv.get(key, 'json');
    return (val as T) ?? null;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    await this.kv.put(key, JSON.stringify(value), {
      expirationTtl: ttlSeconds,
    });
  }

  async del(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await fn();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}

/** Build a namespaced cache key */
export function cacheKey(namespace: string, ...parts: string[]): string {
  return [namespace, ...parts].join(':');
}

export function createCache(env: Env): KVCache {
  return new KVCache(env.CACHE);
}
