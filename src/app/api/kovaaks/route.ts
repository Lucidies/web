import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/server/rate-limit';
import { kvGetWithStale, kvSetWithTimestamp } from '@/lib/server/kv-cache';
import type { KovaaksBenchmarkProgress, KovaaksCategoryProgress, KovaaksData, KovaaksVtEnergyResult } from '@/lib/types';
import { calculateVtEnergyForTier, getBestVtEnergyResult } from '@/lib/vt-energy';
import { STEAM_API_KEY, KOVAAKS_USERNAME, KOVAAKS_STEAM_ID } from '@/lib/constants';

const KOVAAKS_API_BASE = 'https://kovaaks.com/webapp-backend';
const KOVAAKS_DEFAULT_USERNAME = KOVAAKS_USERNAME;
const KOVAAKS_DEFAULT_STEAM_ID = KOVAAKS_STEAM_ID;

// Voltaic S5 Benchmark IDs for each tier (numeric IDs from KoVaaK's API)
const VOLTAIC_S5_BENCHMARKS = {
  novice: { id: '459', label: 'Novice' },
  intermediate: { id: '458', label: 'Intermediate' },
  advanced: { id: '460', label: 'Advanced' },
  elite: { id: '475', label: 'Elite' },
};

const KOVAAKS_CACHE_TTL_MS = 5 * 60 * 1000;
const KOVAAKS_STALE_TTL_MS = 15 * 60 * 1000;
const KOVAAKS_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const KOVAAKS_RATE_LIMIT_MAX_REQUESTS = 30;
const KOVAAKS_SEARCH_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const KOVAAKS_SEARCH_RATE_LIMIT_MAX_REQUESTS = 10;

// Per-user in-memory caches
const userCaches = new Map<string, { payload: KovaaksData; cachedAt: number }>();
const userInFlight = new Map<string, Promise<KovaaksData>>();

class KovaaksApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'KovaaksApiError';
  }
}

function getCacheHeaders(cacheStatus: 'HIT' | 'MISS' | 'SHARED' | 'STALE' | 'HIT_KV'): HeadersInit {
  return {
    'Cache-Control': 's-maxage=300, stale-while-revalidate=900',
    'X-Kovaaks-Cache': cacheStatus,
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

function getCacheKey(steamId: string): string {
  return `api:kovaaks:${steamId}`;
}

/**
 * Fetch benchmark progress for a user by steamId using the same endpoint
 * as the standalone VT-Energy calculator.
 */
async function fetchBenchmarkProgress(
  benchmarkId: string,
  steamId: string
): Promise<KovaaksBenchmarkProgress | null> {
  const url = `${KOVAAKS_API_BASE}/benchmarks/player-progress-rank-benchmark?benchmarkId=${benchmarkId}&steamId=${steamId}&page=0&max=100`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'luca-website/1.0',
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new KovaaksApiError(
        'Rate limited by the KoVaaK\'s API. Please try again in a minute.',
        429,
        'RATE_LIMITED'
      );
    }
    if (response.status === 404 || response.status === 409 || response.status === 400) {
      return null;
    }
    const errorText = await response.text();
    throw new KovaaksApiError(
      `KoVaaK's API error: ${response.status} - ${errorText}`,
      response.status >= 500 ? 502 : response.status,
      'KOVAAKS_UPSTREAM_ERROR'
    );
  }

  return response.json() as Promise<KovaaksBenchmarkProgress>;
}

/**
 * Try to resolve a username to a steamId using multiple approaches.
 */
async function resolveUserSteamId(username: string): Promise<{ steamId: string; resolvedUsername: string } | null> {
  // Approach 1: Try the user profile by-name endpoint
  try {
    const url = `${KOVAAKS_API_BASE}/user/profile/by-name?username=${encodeURIComponent(username)}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'luca-website/1.0',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const sid = data?.steamId || data?.steam_id || null;
      if (sid) return { steamId: sid, resolvedUsername: data?.username || data?.name || username };
    }
  } catch {
    // Continue to next approach
  }

  // Approach 2: Try the user search endpoint
  try {
    const url = `${KOVAAKS_API_BASE}/user/search?username=${encodeURIComponent(username)}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'luca-website/1.0',
      },
    });

    if (response.ok) {
      const data = await response.json();
      // The search endpoint may return an array of results
      const results = Array.isArray(data) ? data : data?.results || data?.users || [];
      if (results.length > 0) {
        // Find exact match first, then fall back to first result
        const exact = results.find((r: Record<string, unknown>) =>
          (r.username as string || r.name as string || '').toLowerCase() === username.toLowerCase()
        );
        const match = exact || results[0];
        const sid = match?.steamId || match?.steam_id || null;
        if (sid) return { steamId: sid as string, resolvedUsername: (match?.username || match?.name || username) as string };
      }
    }
  } catch {
    // Continue
  }

  // Approach 3: Try directly as a steamId (if it looks numeric)
  if (/^\d+$/.test(username) && username.length >= 10) {
    return { steamId: username, resolvedUsername: username };
  }

  return null;
}

/**
 * Fetch Steam avatar URL for a given steamId using the Steam Web API.
 */
async function fetchSteamAvatar(steamId: string): Promise<string | undefined> {
  if (!STEAM_API_KEY) return undefined;
  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`;
    const response = await fetch(url, { next: { revalidate: 600 } });
    if (!response.ok) return undefined;
    const data = await response.json();
    const player = data?.response?.players?.[0];
    return player?.avatarfull || player?.avatarmedium || player?.avatar || undefined;
  } catch {
    return undefined;
  }
}

async function fetchFreshKovaaksData(steamId: string, username: string): Promise<KovaaksData> {
  // Fetch all benchmark tiers + Steam avatar in parallel
  const benchmarkPromises = Object.entries(VOLTAIC_S5_BENCHMARKS).map(
    async ([tier, { id }]) => {
      try {
        const progress = await fetchBenchmarkProgress(id, steamId);
        return [tier, progress] as const;
      } catch (error) {
        // If rate limited, propagate the error
        if (error instanceof KovaaksApiError && error.status === 429) {
          throw error;
        }
        console.warn(`Failed to fetch benchmark ${tier} for ${steamId}:`, error);
        return [tier, null] as const;
      }
    }
  );

  const [results, avatarUrl] = await Promise.all([
    Promise.all(benchmarkPromises),
    fetchSteamAvatar(steamId),
  ]);
  const allBenchmarks: Record<string, KovaaksBenchmarkProgress | null> = Object.fromEntries(results);

  // Count scenarios and plays from benchmark data
  let completedScenarios = 0;
  const scenarioNames = new Set<string>();

  for (const benchmarkData of Object.values(allBenchmarks)) {
    if (benchmarkData?.categories) {
      for (const category of Object.values(benchmarkData.categories) as KovaaksCategoryProgress[]) {
        for (const [scenarioName, scenario] of Object.entries(category.scenarios)) {
          scenarioNames.add(scenarioName);
          if (scenario.score > 0) completedScenarios++;
        }
      }
    }
  }

  // Check if we got any data at all
  const hasAnyData = Object.values(allBenchmarks).some((bm) => bm !== null);
  if (!hasAnyData) {
    throw new KovaaksApiError(
      `No benchmark data found for Steam ID "${steamId}"`,
      404,
      'NOT_FOUND'
    );
  }

  // Build profile from benchmark data
  const profile = {
    steamId,
    webAppUsername: username,
    avatarUrl,
    totalPlays: completedScenarios,
    scenarioCount: scenarioNames.size,
    playtimeSeconds: 0,
  };

  // Find the highest tier benchmark that has completed scenarios
  let primaryBenchmark: KovaaksBenchmarkProgress | null = null;

  // Check from elite down to novice for the best available benchmark with actual progress
  for (const tier of ['elite', 'advanced', 'intermediate', 'novice']) {
    const bm = allBenchmarks[tier];
    if (bm && bm.overall_rank >= 0 && bm.overall_rank < bm.ranks.length) {
      primaryBenchmark = bm;
      break;
    }
  }

  // If no tier has a valid rank, fall back to the first tier with any data
  if (!primaryBenchmark) {
    for (const tier of ['elite', 'advanced', 'intermediate', 'novice']) {
      if (allBenchmarks[tier]) {
        primaryBenchmark = allBenchmarks[tier];
        break;
      }
    }
  }

  // Calculate VT-Energy ranks for each tier that has benchmark data
  const vtEnergy: Record<string, KovaaksVtEnergyResult | null> = {};
  for (const tier of ['novice', 'intermediate', 'advanced', 'elite']) {
    const bm = allBenchmarks[tier];
    if (bm) {
      // The API data from KoVaaK's matches the shape expected by calculateVtEnergyForTier
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = calculateVtEnergyForTier(bm as any, tier);
      vtEnergy[tier] = result as KovaaksVtEnergyResult | null;
    } else {
      vtEnergy[tier] = null;
    }
  }

  const bestVtEnergy = getBestVtEnergyResult(vtEnergy) as KovaaksVtEnergyResult | null;

  return {
    profile,
    benchmarks: primaryBenchmark,
    allBenchmarks: allBenchmarks as Record<string, KovaaksBenchmarkProgress | null>,
    recentScores: [],
    vtEnergy,
    bestVtEnergy,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchUsername = searchParams.get('username');
  const searchSteamId = searchParams.get('steamId');
  const isSearch = Boolean(searchUsername || searchSteamId);

  // Determine the steamId to use
  let steamId = searchSteamId || '';
  let username = searchUsername || (searchSteamId ? searchSteamId : KOVAAKS_DEFAULT_USERNAME);

  // If we have a steamId from search but no username, try to resolve the username
  if (steamId && !searchUsername && searchSteamId) {
    // Try multiple approaches to resolve username from steamId
    let resolved = false;

    // Approach 1: KoVaaK's profile by-steamid endpoint
    if (!resolved) {
      try {
        const url = `${KOVAAKS_API_BASE}/user/profile/by-steamid?steamId=${encodeURIComponent(steamId)}`;
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'luca-website/1.0' },
        });
        if (response.ok) {
          const data = await response.json();
          const resolvedName = data?.username || data?.name || null;
          if (resolvedName) { username = resolvedName; resolved = true; }
        }
      } catch {
        // Continue to next approach
      }
    }

    // Approach 2: KoVaaK's profile by-name using steamId as username
    if (!resolved) {
      try {
        const url = `${KOVAAKS_API_BASE}/user/profile/by-name?username=${encodeURIComponent(steamId)}`;
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'luca-website/1.0' },
        });
        if (response.ok) {
          const data = await response.json();
          const resolvedName = data?.username || data?.name || null;
          if (resolvedName) { username = resolvedName; resolved = true; }
        }
      } catch {
        // Continue to next approach
      }
    }

    // Approach 3: Use Steam persona name as fallback display name
    if (!resolved && STEAM_API_KEY) {
      try {
        const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const player = data?.response?.players?.[0];
          const personaName = player?.personaname || null;
          if (personaName) { username = personaName; resolved = true; }
        }
      } catch {
        // Continue with steamId as display name
      }
    }
  }

  // If we have a username but no steamId, try to resolve it
  if (!steamId && searchUsername) {
    const resolved = await resolveUserSteamId(searchUsername);
    if (resolved) {
      steamId = resolved.steamId;
      username = resolved.resolvedUsername;
    } else {
      return NextResponse.json(
        { error: `Could not find Steam ID for username "${searchUsername}"`, code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
  }

  // For default user, use env steam ID
  if (!steamId && !isSearch) {
    steamId = KOVAAKS_DEFAULT_STEAM_ID;
    if (!steamId) {
      // Try resolving default username
      const resolved = await resolveUserSteamId(KOVAAKS_DEFAULT_USERNAME);
      if (resolved) {
        steamId = resolved.steamId;
        username = resolved.resolvedUsername;
      } else {
        return NextResponse.json(
          { error: 'No Steam ID configured. Set KOVAAKS_STEAM_ID env variable.', code: 'CONFIG_ERROR' },
          { status: 500 }
        );
      }
    }
  }

  const cacheKey = getCacheKey(steamId);

  // Apply rate limits
  const rateLimitResult = rateLimit(request, {
    namespace: isSearch ? 'api:kovaaks:search' : 'api:kovaaks',
    limit: isSearch ? KOVAAKS_SEARCH_RATE_LIMIT_MAX_REQUESTS : KOVAAKS_RATE_LIMIT_MAX_REQUESTS,
    windowMs: isSearch ? KOVAAKS_SEARCH_RATE_LIMIT_WINDOW_MS : KOVAAKS_RATE_LIMIT_WINDOW_MS,
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
  let staleKvPayload: KovaaksData | null = null;

  // Check in-memory cache
  const memoryHit = userCaches.get(cacheKey);
  if (memoryHit && now - memoryHit.cachedAt < KOVAAKS_CACHE_TTL_MS) {
    return NextResponse.json(memoryHit.payload, {
      headers: mergeHeaders(rateLimitResult.headers, getCacheHeaders('HIT')),
    });
  }

  // Check KV cache
  try {
    const kvResult = await kvGetWithStale<KovaaksData>(cacheKey, {
      freshMs: KOVAAKS_CACHE_TTL_MS,
      staleMs: KOVAAKS_STALE_TTL_MS,
    });

    if (kvResult && !kvResult.isStale) {
      userCaches.set(cacheKey, { payload: kvResult.value, cachedAt: now });
      return NextResponse.json(kvResult.value, {
        headers: mergeHeaders(rateLimitResult.headers, getCacheHeaders('HIT_KV')),
      });
    }

    if (kvResult?.isStale) {
      staleKvPayload = kvResult.value;
    }
  } catch {
    // KV unavailable, continue
  }

  // Check if there's already an in-flight request for this user
  const existingFlight = userInFlight.get(cacheKey);
  if (existingFlight) {
    try {
      const payload = await existingFlight;
      return NextResponse.json(payload, {
        headers: mergeHeaders(rateLimitResult.headers, getCacheHeaders('SHARED')),
      });
    } catch {
      // Fall through to fresh fetch
    }
  }

  // Fetch fresh data
  const fetchPromise = fetchFreshKovaaksData(steamId, username);
  userInFlight.set(cacheKey, fetchPromise);

  try {
    const payload = await fetchPromise;

    // Cache the result
    userCaches.set(cacheKey, { payload, cachedAt: Date.now() });
    try {
      await kvSetWithTimestamp(cacheKey, payload, KOVAAKS_CACHE_TTL_MS + KOVAAKS_STALE_TTL_MS);
    } catch {
      // KV write failed, continue
    }

    return NextResponse.json(payload, {
      headers: mergeHeaders(rateLimitResult.headers, getCacheHeaders('MISS')),
    });
  } catch (error) {
    // Return stale data if available
    if (staleKvPayload) {
      return NextResponse.json(
        { ...staleKvPayload, stale: true },
        {
          headers: mergeHeaders(rateLimitResult.headers, getCacheHeaders('STALE')),
        }
      );
    }

    if (error instanceof KovaaksApiError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          retryAfter: error.retryAfter,
        },
        {
          status: error.status,
          headers: mergeHeaders(rateLimitResult.headers, { 'Cache-Control': 'no-store' }),
        }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      {
        status: 500,
        headers: mergeHeaders(rateLimitResult.headers, { 'Cache-Control': 'no-store' }),
      }
    );
  } finally {
    userInFlight.delete(cacheKey);
  }
}