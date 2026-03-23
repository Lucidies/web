import { createClient, type RedisClientType } from 'redis';

declare global {
  // eslint-disable-next-line no-var
  var __sitesRedisClient: RedisClientType | undefined;
  // eslint-disable-next-line no-var
  var __sitesRedisAvailable: boolean | undefined;
  // eslint-disable-next-line no-var
  var __sitesRedisChecked: boolean | undefined;
}

const REDIS_URL = process.env.REDIS_URL || '';
const REDIS_CONNECT_TIMEOUT_MS = 1500;

function createRedisClient(): RedisClientType {
  return createClient({
    url: REDIS_URL,
    socket: {
      connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
      reconnectStrategy: false, // Don't auto-reconnect; we handle it manually
    },
  });
}

/**
 * Get a connected Redis client. Returns null immediately if:
 * - No REDIS_URL is configured
 * - Redis was previously found to be unavailable
 * - Connection times out
 * 
 * This function is designed to NEVER block the request for more than ~1.5s.
 */
export async function getRedis(): Promise<RedisClientType | null> {
  // No Redis URL configured - skip entirely
  if (!REDIS_URL) {
    return null;
  }

  // Already checked and found unavailable
  if (globalThis.__sitesRedisChecked && !globalThis.__sitesRedisAvailable) {
    return null;
  }

  // Already have a connected client
  if (globalThis.__sitesRedisClient?.isOpen && globalThis.__sitesRedisClient?.isReady) {
    return globalThis.__sitesRedisClient;
  }

  // Try to connect with a hard timeout
  try {
    const client = globalThis.__sitesRedisClient ?? createRedisClient();
    globalThis.__sitesRedisClient = client;

    // Attach error handler to prevent unhandled rejections
    if (!client.listenerCount('error')) {
      client.on('error', (err) => {
        console.warn('[Redis] Error:', err.message);
        globalThis.__sitesRedisAvailable = false;
      });
    }

    if (client.isOpen && client.isReady) {
      globalThis.__sitesRedisAvailable = true;
      globalThis.__sitesRedisChecked = true;
      return client;
    }

    if (client.isOpen) {
      // Client is open but not ready - close and retry
      try { await client.disconnect(); } catch { /* ignore */ }
    }

    // Race connect against timeout
    const connected = await Promise.race([
      client.connect().then(() => true),
      new Promise<false>((resolve) => setTimeout(() => resolve(false), REDIS_CONNECT_TIMEOUT_MS)),
    ]);

    if (connected && client.isReady) {
      globalThis.__sitesRedisAvailable = true;
      globalThis.__sitesRedisChecked = true;
      console.log('[Redis] Connected successfully');
      return client;
    }

    // Timed out or not ready
    console.warn('[Redis] Connection timed out, using in-memory fallback');
    globalThis.__sitesRedisAvailable = false;
    globalThis.__sitesRedisChecked = true;
    try { await client.disconnect(); } catch { /* ignore */ }
    return null;
  } catch (err) {
    console.warn('[Redis] Connection failed:', (err as Error).message);
    globalThis.__sitesRedisAvailable = false;
    globalThis.__sitesRedisChecked = true;
    return null;
  }
}
