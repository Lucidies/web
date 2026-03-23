import { getRedis } from './redis';

interface RateLimitConfig {
  namespace: string;
  limit: number;
  windowMs: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
  resetAt: number;
  headers: HeadersInit;
}

// In-memory fallback store
declare global {
  // eslint-disable-next-line no-var
  var __sitesRateLimitStore: Map<string, RateLimitBucket> | undefined;
}

const rateLimitStore = globalThis.__sitesRateLimitStore ?? new Map<string, RateLimitBucket>();
if (!globalThis.__sitesRateLimitStore) {
  globalThis.__sitesRateLimitStore = rateLimitStore;
}

function cleanupExpiredBuckets(now: number) {
  if (rateLimitStore.size < 2000) return;

  for (const [key, bucket] of rateLimitStore.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Rate limit using Redis with in-memory fallback.
 * Uses Redis INCR + EXPIRE for atomic, distributed rate limiting.
 */
export async function rateLimitAsync(request: Request, config: RateLimitConfig): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const key = `ratelimit:${config.namespace}:${ip}`;
  const windowSec = Math.ceil(config.windowMs / 1000);

  try {
    const redis = await getRedis();
    if (redis) {
      // Use Redis INCR for atomic counting
      const count = await redis.incr(key);

      // Set expiry on first request in window
      if (count === 1) {
        await redis.expire(key, windowSec);
      }

      // Get TTL for retry-after calculation
      const ttl = await redis.ttl(key);
      const retryAfter = Math.max(0, ttl);
      const remaining = Math.max(0, config.limit - count);
      const ok = count <= config.limit;
      const resetAt = Date.now() + (ttl > 0 ? ttl * 1000 : config.windowMs);

      return {
        ok,
        limit: config.limit,
        remaining,
        retryAfter,
        resetAt,
        headers: {
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
          ...(ok ? {} : { 'Retry-After': String(retryAfter) }),
        },
      };
    }
  } catch (err) {
    console.warn('[rate-limit] Redis rate limit failed, using memory fallback:', (err as Error).message);
  }

  // Fallback to in-memory rate limiting
  return rateLimitMemory(request, config);
}

/**
 * Synchronous in-memory rate limiter (fallback when Redis is unavailable).
 * Also used as the primary rate limiter for backward compatibility.
 */
export function rateLimit(request: Request, config: RateLimitConfig): RateLimitResult {
  return rateLimitMemory(request, config);
}

function rateLimitMemory(request: Request, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const ip = getClientIp(request);
  const key = `${config.namespace}:${ip}`;

  const existingBucket = rateLimitStore.get(key);
  const bucket: RateLimitBucket =
    existingBucket && existingBucket.resetAt > now
      ? existingBucket
      : { count: 0, resetAt: now + config.windowMs };

  bucket.count += 1;
  rateLimitStore.set(key, bucket);

  const remaining = Math.max(0, config.limit - bucket.count);
  const retryAfter = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000));
  const ok = bucket.count <= config.limit;

  return {
    ok,
    limit: config.limit,
    remaining,
    retryAfter,
    resetAt: bucket.resetAt,
    headers: {
      'X-RateLimit-Limit': String(config.limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(bucket.resetAt / 1000)),
      ...(ok ? {} : { 'Retry-After': String(retryAfter) }),
    },
  };
}
