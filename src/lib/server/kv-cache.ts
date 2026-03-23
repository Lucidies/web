import { getRedis } from './redis';

interface CacheEnvelope<T> {
  value: T;
  cachedAt: number;
}

interface MemoryEntry {
  payload: string;
  expiresAt: number;
}

interface KvReadOptions {
  freshMs: number;
  staleMs: number;
}

export interface KvReadResult<T> {
  value: T;
  ageMs: number;
  isStale: boolean;
  source: 'memory' | 'redis';
}

// In-memory fallback store (used when Redis is unavailable)
declare global {
  // eslint-disable-next-line no-var
  var __sitesKvMemoryStore: Map<string, MemoryEntry> | undefined;
}

const memoryStore = globalThis.__sitesKvMemoryStore ?? new Map<string, MemoryEntry>();
if (!globalThis.__sitesKvMemoryStore) {
  globalThis.__sitesKvMemoryStore = memoryStore;
}

function nowMs() {
  return Date.now();
}

function cleanupExpiredMemoryEntries(now: number) {
  if (memoryStore.size < 1000) return;

  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}

function parseEnvelope<T>(raw: string): CacheEnvelope<T> | null {
  try {
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!('cachedAt' in parsed) || typeof parsed.cachedAt !== 'number') return null;
    if (!('value' in parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeInMemory(key: string, payload: string, ttlMs: number) {
  memoryStore.set(key, {
    payload,
    expiresAt: nowMs() + ttlMs,
  });
}

/**
 * Read from Redis with stale-while-revalidate semantics.
 * Falls back to in-memory store if Redis is unavailable.
 */
export async function kvGetWithStale<T>(key: string, options: KvReadOptions): Promise<KvReadResult<T> | null> {
  const now = nowMs();
  cleanupExpiredMemoryEntries(now);

  const maxAgeMs = options.freshMs + options.staleMs;

  // Try in-memory first (fastest)
  const memoryHit = memoryStore.get(key);
  if (memoryHit && memoryHit.expiresAt > now) {
    const parsed = parseEnvelope<T>(memoryHit.payload);
    if (parsed) {
      const ageMs = now - parsed.cachedAt;
      if (ageMs <= maxAgeMs) {
        return {
          value: parsed.value,
          ageMs,
          isStale: ageMs > options.freshMs,
          source: 'memory',
        };
      }
    }
    memoryStore.delete(key);
  }

  // Try Redis
  try {
    const redis = await getRedis();
    if (redis) {
      const redisPayload = await redis.get(key);
      if (redisPayload) {
        const parsed = parseEnvelope<T>(redisPayload);
        if (parsed) {
          const ageMs = now - parsed.cachedAt;
          if (ageMs <= maxAgeMs) {
            // Populate in-memory cache from Redis
            storeInMemory(key, redisPayload, maxAgeMs - ageMs);
            return {
              value: parsed.value,
              ageMs,
              isStale: ageMs > options.freshMs,
              source: 'redis',
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('[kv-cache] Redis read failed, using memory fallback:', (err as Error).message);
  }

  return null;
}

/**
 * Write to both Redis and in-memory cache with a timestamp envelope.
 */
export async function kvSetWithTimestamp<T>(key: string, value: T, ttlMs: number): Promise<void> {
  const envelope: CacheEnvelope<T> = {
    value,
    cachedAt: nowMs(),
  };

  const payload = JSON.stringify(envelope);

  // Always store in memory
  storeInMemory(key, payload, ttlMs);

  // Store in Redis
  try {
    const redis = await getRedis();
    if (redis) {
      const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
      await redis.setEx(key, ttlSeconds, payload);
    }
  } catch (err) {
    console.warn('[kv-cache] Redis write failed:', (err as Error).message);
  }
}
