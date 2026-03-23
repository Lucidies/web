import { NextResponse } from 'next/server';
import { STEAM_ID, STEAM_API_KEY } from '@/lib/constants';
import { kvGetWithStale, kvSetWithTimestamp } from '@/lib/server/kv-cache';
import { rateLimit } from '@/lib/server/rate-limit';

type SteamGame = {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
};

type SteamPayload = { games: SteamGame[]; stale?: boolean };

const STEAM_CACHE_TTL_MS = 2 * 60 * 1000;
const STEAM_STALE_TTL_MS = 10 * 60 * 1000;
const STEAM_CACHE_KEY = 'api:steam:default:v1';
const STEAM_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const STEAM_RATE_LIMIT_MAX_REQUESTS = 60;

let steamCache: { data: SteamPayload; cachedAt: number } | null = null;
let steamInFlight: Promise<SteamPayload> | null = null;

function getCacheHeaders(cacheStatus: 'HIT' | 'MISS' | 'SHARED' | 'STALE' | 'HIT_KV'): HeadersInit {
  return {
    'Cache-Control': 's-maxage=120, stale-while-revalidate=600',
    'X-Steam-Cache': cacheStatus,
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

async function fetchFreshSteamData(): Promise<SteamPayload> {
  if (!STEAM_API_KEY || !STEAM_ID) {
    throw new Error('STEAM_CONFIG_MISSING');
  }

  let steamUrl = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&format=json`;
  let response = await fetch(steamUrl, {
    next: { revalidate: 180 },
  });

  if (!response.ok) {
    throw new Error(`Steam recently played request failed: ${response.status}`);
  }

  let data = await response.json();

  if (data?.response?.games && data.response.games.length > 0) {
    return {
      games: (data.response.games as SteamGame[]).slice(0, 3),
      stale: false,
    };
  }

  steamUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&format=json&include_appinfo=1&include_played_free_games=1`;
  response = await fetch(steamUrl, {
    next: { revalidate: 180 },
  });

  if (!response.ok) {
    throw new Error(`Steam owned games request failed: ${response.status}`);
  }

  data = await response.json();

  if (data?.response?.games && data.response.games.length > 0) {
    const sortedGames = (data.response.games as SteamGame[])
      .filter((game) => game.playtime_forever > 0)
      .sort((a, b) => b.playtime_forever - a.playtime_forever)
      .slice(0, 3);

    return {
      games: sortedGames,
      stale: false,
    };
  }

  return {
    games: [],
    stale: false,
  };
}

export async function GET(request: Request) {
  const rateLimitResult = rateLimit(request, {
    namespace: 'api:steam',
    limit: STEAM_RATE_LIMIT_MAX_REQUESTS,
    windowMs: STEAM_RATE_LIMIT_WINDOW_MS,
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

  if (!STEAM_API_KEY || !STEAM_ID) {
    return NextResponse.json(
      { error: 'Steam credentials are not configured', code: 'STEAM_CONFIG_MISSING' },
      { status: 500, headers: mergeHeaders(rateLimitResult.headers) }
    );
  }

  const now = Date.now();
  let staleKvPayload: SteamPayload | null = null;

  if (steamCache && now - steamCache.cachedAt < STEAM_CACHE_TTL_MS) {
    return NextResponse.json(steamCache.data, {
      headers: mergeHeaders(getCacheHeaders('HIT'), rateLimitResult.headers),
    });
  }

  const kvData = await kvGetWithStale<SteamPayload>(STEAM_CACHE_KEY, {
    freshMs: STEAM_CACHE_TTL_MS,
    staleMs: STEAM_STALE_TTL_MS,
  });

  if (kvData) {
    if (kvData.isStale) {
      staleKvPayload = kvData.value;
    } else {
      steamCache = {
        data: kvData.value,
        cachedAt: now - kvData.ageMs,
      };
      return NextResponse.json(kvData.value, {
        headers: mergeHeaders(getCacheHeaders('HIT_KV'), rateLimitResult.headers),
      });
    }
  }

  if (steamInFlight) {
    try {
      const sharedPayload = await steamInFlight;
      return NextResponse.json(sharedPayload, {
        headers: mergeHeaders(getCacheHeaders('SHARED'), rateLimitResult.headers),
      });
    } catch {
      // Continue with a fresh fetch below.
    }
  }

  const fetchTask = fetchFreshSteamData();
  steamInFlight = fetchTask;

  try {
    const payload = await fetchTask;
    steamCache = { data: payload, cachedAt: Date.now() };
    void kvSetWithTimestamp(STEAM_CACHE_KEY, payload, STEAM_CACHE_TTL_MS + STEAM_STALE_TTL_MS);

    return NextResponse.json(payload, {
      headers: mergeHeaders(getCacheHeaders('MISS'), rateLimitResult.headers),
    });
  } catch (error) {
    console.error('Steam API error:', error);

    if (steamCache && now - steamCache.cachedAt < STEAM_CACHE_TTL_MS + STEAM_STALE_TTL_MS) {
      return NextResponse.json(
        { ...steamCache.data, stale: true },
        { headers: mergeHeaders(getCacheHeaders('STALE'), rateLimitResult.headers) }
      );
    }

    if (staleKvPayload) {
      return NextResponse.json(
        { ...staleKvPayload, stale: true },
        { headers: mergeHeaders(getCacheHeaders('STALE'), rateLimitResult.headers) }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch Steam data', code: 'STEAM_UPSTREAM_ERROR' },
      { status: 502, headers: mergeHeaders(rateLimitResult.headers) }
    );
  } finally {
    if (steamInFlight === fetchTask) {
      steamInFlight = null;
    }
  }
}
