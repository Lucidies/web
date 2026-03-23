import { NextResponse } from 'next/server';
import { OSU_CLIENT_ID, OSU_CLIENT_SECRET, OSU_USERNAME } from '@/lib/constants';
import { kvGetWithStale, kvSetWithTimestamp } from '@/lib/server/kv-cache';
import { rateLimit } from '@/lib/server/rate-limit';
import type { OsuManiaData, OsuScore, OsuUser } from '@/lib/types';

const OSU_API_BASE = 'https://osu.ppy.sh/api/v2';
const OSU_TOKEN_URL = 'https://osu.ppy.sh/oauth/token';
const OSU_CACHE_TTL_MS = 2 * 60 * 1000;
const OSU_STALE_TTL_MS = 10 * 60 * 1000;
const OSU_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const OSU_RATE_LIMIT_MAX_REQUESTS = 45;

// Search-specific rate limits (stricter to prevent API abuse)
const OSU_SEARCH_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const OSU_SEARCH_RATE_LIMIT_MAX_REQUESTS = 15;

// In-memory token cache
let cachedToken: { access_token: string; expires_at: number } | null = null;

// Per-user in-memory caches
const userCaches = new Map<string, { payload: OsuManiaData; cachedAt: number }>();
const userInFlight = new Map<string, Promise<OsuManiaData>>();

class OsuApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'OsuApiError';
  }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getCacheHeaders(cacheStatus: 'HIT' | 'MISS' | 'SHARED' | 'STALE' | 'HIT_KV'): HeadersInit {
  return {
    'Cache-Control': 's-maxage=120, stale-while-revalidate=600',
    'X-Osu-Cache': cacheStatus,
  };
}

function mergeHeaders(...headerSets: Array<HeadersInit | undefined>): HeadersInit {
  const merged = new Headers();
  for (const headers of headerSets) {
    if (!headers) continue;
    const normalized = new Headers(headers);
    for (const [key, value] of normalized.entries()) {
      merged.set(key, value);
    }
  }
  return merged;
}

function getCacheKey(username: string): string {
  return `api:osu:mania:${username.toLowerCase()}`;
}

async function getOsuToken(): Promise<string> {
  if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
    throw new OsuApiError('osu! API credentials not configured', 500, 'OSU_CONFIG_MISSING');
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expires_at > Date.now() + 60000) {
    return cachedToken.access_token;
  }

  const response = await fetch(OSU_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: parseInt(OSU_CLIENT_ID),
      client_secret: OSU_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'public',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new OsuApiError(
      `Failed to get osu! token: ${response.status} - ${errorText}`,
      response.status >= 500 ? 502 : response.status,
      'OSU_TOKEN_ERROR'
    );
  }

  const data = await response.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in * 1000),
  };

  return cachedToken.access_token;
}

async function osuFetch<T>(endpoint: string, token: string): Promise<T> {
  const response = await fetch(`${OSU_API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    next: { revalidate: 120 },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) {
      const retryAfter = parseRetryAfter(response.headers.get('Retry-After'));
      throw new OsuApiError(
        'Rate limited by the osu! API. Please try again in a minute.',
        429,
        'RATE_LIMITED',
        retryAfter
      );
    }
    throw new OsuApiError(
      `osu! API error: ${response.status} - ${errorText}`,
      response.status >= 500 ? 502 : response.status,
      response.status === 404 ? 'NOT_FOUND' : 'OSU_UPSTREAM_ERROR'
    );
  }

  return response.json() as Promise<T>;
}

async function fetchFreshOsuData(username: string, forceMode?: string): Promise<OsuManiaData> {
  const token = await getOsuToken();

  let user: OsuUser;
  let gameMode: string;

  if (forceMode) {
    // For the default user, use the forced mode (mania)
    gameMode = forceMode;
    try {
      user = await osuFetch<OsuUser>(
        `/users/${encodeURIComponent(username)}/${gameMode}?key=username`,
        token
      );
    } catch (error) {
      if (error instanceof OsuApiError && error.status === 404) {
        throw new OsuApiError(`Player "${username}" not found`, 404, 'NOT_FOUND');
      }
      throw error;
    }
  } else {
    // For searched users, fetch profile first to discover their default playmode
    try {
      user = await osuFetch<OsuUser>(
        `/users/${encodeURIComponent(username)}?key=username`,
        token
      );
    } catch (error) {
      if (error instanceof OsuApiError && error.status === 404) {
        throw new OsuApiError(`Player "${username}" not found`, 404, 'NOT_FOUND');
      }
      throw error;
    }

    // Use the user's default playmode (osu, taiko, fruits, mania)
    gameMode = user.playmode || 'osu';

    // Re-fetch with the correct mode to get mode-specific statistics
    try {
      user = await osuFetch<OsuUser>(
        `/users/${user.id}/${gameMode}`,
        token
      );
    } catch {
      // If mode-specific fetch fails, use the already fetched profile
      console.log(`[osu!] Failed to fetch mode-specific profile for ${username} in ${gameMode}, using default`);
    }
  }

  const userId = user.id;

  const [recentScores, bestScores] = await Promise.all([
    osuFetch<OsuScore[]>(`/users/${userId}/scores/recent?mode=${gameMode}&include_fails=1&limit=20`, token),
    osuFetch<OsuScore[]>(`/users/${userId}/scores/best?mode=${gameMode}&limit=10`, token),
  ]);

  return {
    user,
    recentScores,
    bestScores,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchUsername = searchParams.get('username');
  const isSearch = Boolean(searchUsername);
  const targetUsername = searchUsername || OSU_USERNAME;
  const cacheKey = getCacheKey(targetUsername);

  // Apply stricter rate limits for search requests
  const rateLimitResult = rateLimit(request, {
    namespace: isSearch ? 'api:osu:search' : 'api:osu',
    limit: isSearch ? OSU_SEARCH_RATE_LIMIT_MAX_REQUESTS : OSU_RATE_LIMIT_MAX_REQUESTS,
    windowMs: isSearch ? OSU_SEARCH_RATE_LIMIT_WINDOW_MS : OSU_RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimitResult.ok) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please retry shortly.',
        code: 'RATE_LIMITED_LOCAL',
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: mergeHeaders(rateLimitResult.headers, { 'Cache-Control': 'no-store' }),
      }
    );
  }

  const now = Date.now();
  let staleKvPayload: OsuManiaData | null = null;

  // Check in-memory cache for this user
  const memCache = userCaches.get(cacheKey);
  if (memCache && now - memCache.cachedAt < OSU_CACHE_TTL_MS) {
    return NextResponse.json(memCache.payload, {
      headers: mergeHeaders(getCacheHeaders('HIT'), rateLimitResult.headers),
    });
  }

  // Check Redis/KV cache
  const kvData = await kvGetWithStale<OsuManiaData>(cacheKey, {
    freshMs: OSU_CACHE_TTL_MS,
    staleMs: OSU_STALE_TTL_MS,
  });

  if (kvData) {
    if (kvData.isStale) {
      staleKvPayload = kvData.value;
    } else {
      userCaches.set(cacheKey, {
        payload: kvData.value,
        cachedAt: now - kvData.ageMs,
      });
      return NextResponse.json(kvData.value, {
        headers: mergeHeaders(getCacheHeaders('HIT_KV'), rateLimitResult.headers),
      });
    }
  }

  // Check if there's already an in-flight request for this user
  const existingFlight = userInFlight.get(cacheKey);
  if (existingFlight) {
    try {
      const sharedPayload = await existingFlight;
      return NextResponse.json(sharedPayload, {
        headers: mergeHeaders(getCacheHeaders('SHARED'), rateLimitResult.headers),
      });
    } catch {
      // Continue with fresh fetch.
    }
  }

  // For the default user, force mania mode; for searched users, auto-detect their playmode
  const fetchTask = fetchFreshOsuData(targetUsername, isSearch ? undefined : 'mania');
  userInFlight.set(cacheKey, fetchTask);

  try {
    const payload = await fetchTask;
    userCaches.set(cacheKey, { payload, cachedAt: Date.now() });
    void kvSetWithTimestamp(cacheKey, payload, OSU_CACHE_TTL_MS + OSU_STALE_TTL_MS);

    return NextResponse.json(payload, {
      headers: mergeHeaders(getCacheHeaders('MISS'), rateLimitResult.headers),
    });
  } catch (error) {
    // Try stale in-memory cache
    if (memCache && now - memCache.cachedAt < OSU_CACHE_TTL_MS + OSU_STALE_TTL_MS) {
      return NextResponse.json(
        { ...memCache.payload, stale: true },
        { headers: mergeHeaders(getCacheHeaders('STALE'), rateLimitResult.headers) }
      );
    }

    // Try stale KV cache
    if (staleKvPayload) {
      return NextResponse.json(
        { ...staleKvPayload, stale: true },
        { headers: mergeHeaders(getCacheHeaders('STALE'), rateLimitResult.headers) }
      );
    }

    if (error instanceof OsuApiError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          retryAfter: error.retryAfter,
        },
        { status: error.status, headers: mergeHeaders(rateLimitResult.headers) }
      );
    }

    console.error('osu! API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch osu! data', code: 'OSU_UNKNOWN_ERROR' },
      { status: 500, headers: mergeHeaders(rateLimitResult.headers) }
    );
  } finally {
    if (userInFlight.get(cacheKey) === fetchTask) {
      userInFlight.delete(cacheKey);
    }
  }
}
