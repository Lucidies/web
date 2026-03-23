import { NextResponse } from 'next/server';
import { kvGetWithStale, kvSetWithTimestamp } from '@/lib/server/kv-cache';
import { rateLimit } from '@/lib/server/rate-limit';
import { TWITTER_BEARER_TOKEN, TWITTER_ENABLED, TWITTER_USERNAME } from '@/lib/constants';
import type { TwitterData, TwitterTweet, TwitterUser, TwitterMedia } from '@/lib/types';

const TWITTER_API_BASE = 'https://api.twitter.com/2';
const TWITTER_CACHE_TTL_MS = 2 * 60 * 1000;
const TWITTER_STALE_TTL_MS = 10 * 60 * 1000;
const TWITTER_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const TWITTER_RATE_LIMIT_MAX_REQUESTS = 30;

function getCacheHeaders(cacheStatus: 'HIT' | 'MISS' | 'SHARED' | 'STALE' | 'HIT_KV'): HeadersInit {
  return {
    'Cache-Control': 's-maxage=120, stale-while-revalidate=600',
    'X-Twitter-Cache': cacheStatus,
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

function mapTwitterTweet(tweet: any, user: TwitterUser, mediaByKey: Map<string, TwitterMedia>): TwitterTweet {
  const media: TwitterMedia[] = [];

  if (tweet.attachments?.media_keys && mediaByKey.size > 0) {
    for (const key of tweet.attachments.media_keys) {
      const entry = mediaByKey.get(key);
      if (entry) {
        media.push(entry);
      }
    }
  }

  return {
    id: tweet.id,
    url: `https://x.com/${user.username}/status/${tweet.id}`,
    text: tweet.text,
    created_at: tweet.created_at || new Date().toISOString(),
    author: {
      name: user.name,
      screen_name: user.username,
      avatar_url: user.profile_image_url || '',
    },
    likes: tweet.public_metrics?.like_count ?? 0,
    replies: tweet.public_metrics?.reply_count ?? 0,
    retweets: tweet.public_metrics?.retweet_count ?? 0,
    views: tweet.public_metrics?.impression_count,
    media: media.length > 0 ? media : undefined,
  };
}

export async function GET(request: Request) {
  const rateLimitResult = rateLimit(request, {
    namespace: 'api:twitter',
    limit: TWITTER_RATE_LIMIT_MAX_REQUESTS,
    windowMs: TWITTER_RATE_LIMIT_WINDOW_MS,
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

  if (!TWITTER_ENABLED) {
    return NextResponse.json(
      { error: 'Twitter API is currently disabled' },
      { status: 503, headers: rateLimitResult.headers }
    );
  }

  if (!TWITTER_BEARER_TOKEN) {
    return NextResponse.json(
      { error: 'Twitter bearer token not configured', code: 'TWITTER_CONFIG_MISSING' },
      { status: 500, headers: rateLimitResult.headers }
    );
  }

  const { searchParams } = new URL(request.url);
  const targetUsername = searchParams.get('username') || TWITTER_USERNAME;

  if (!targetUsername) {
    return NextResponse.json(
      { error: 'Twitter username not configured', code: 'TWITTER_USERNAME_MISSING' },
      { status: 400, headers: rateLimitResult.headers }
    );
  }

  const cacheKey = `api:twitter:posts:${targetUsername.toLowerCase()}`;
  const now = Date.now();
  let staleKvPayload: TwitterData | null = null;

  const kvData = await kvGetWithStale<TwitterData>(cacheKey, {
    freshMs: TWITTER_CACHE_TTL_MS,
    staleMs: TWITTER_STALE_TTL_MS,
  });

  if (kvData) {
    if (kvData.isStale) {
      staleKvPayload = kvData.value;
    } else {
      return NextResponse.json(kvData.value, {
        headers: mergeHeaders(getCacheHeaders('HIT_KV'), rateLimitResult.headers),
      });
    }
  }

  try {
    const userResponse = await fetch(
      `${TWITTER_API_BASE}/users/by/username/${encodeURIComponent(targetUsername)}?user.fields=profile_image_url,verified,public_metrics,description,location,url,created_at,banner_url`,
      {
        headers: {
          Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 120 },
      }
    );

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      throw new Error(`Twitter user lookup failed: ${userResponse.status} - ${errorText}`);
    }

    const userJson = await userResponse.json();
    const user = userJson.data as TwitterUser;

    if (!user || !user.id) {
      throw new Error('Twitter user lookup returned no user');
    }

    const tweetResponse = await fetch(
      `${TWITTER_API_BASE}/users/${user.id}/tweets?max_results=6&tweet.fields=created_at,public_metrics,attachments&expansions=attachments.media_keys&media.fields=type,url,preview_image_url,width,height,duration_ms`,
      {
        headers: {
          Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 120 },
      }
    );

    if (!tweetResponse.ok) {
      const errorText = await tweetResponse.text();
      throw new Error(`Twitter timeline fetch failed: ${tweetResponse.status} - ${errorText}`);
    }

    const tweetJson = await tweetResponse.json();
    const tweetsData = Array.isArray(tweetJson.data) ? tweetJson.data : [];
    const includes = tweetJson.includes;

    const mediaByKey = new Map<string, TwitterMedia>();
    if (includes?.media && Array.isArray(includes.media)) {
      for (const item of includes.media) {
        mediaByKey.set(item.media_key, {
          type: item.type,
          url: item.url || item.preview_image_url || '',
          thumbnail_url: item.preview_image_url,
          width: item.width,
          height: item.height,
          duration: item.duration_ms,
        });
      }
    }

    const tweets: TwitterTweet[] = tweetsData.map((tweet) => mapTwitterTweet(tweet, user, mediaByKey));

    const payload: TwitterData = {
      user,
      tweets,
    };

    void kvSetWithTimestamp(cacheKey, payload, TWITTER_CACHE_TTL_MS + TWITTER_STALE_TTL_MS);

    return NextResponse.json(payload, {
      headers: mergeHeaders(getCacheHeaders('MISS'), rateLimitResult.headers),
    });
  } catch (error) {
    console.error('[Twitter API] Error fetching tweets:', error);

    if (staleKvPayload) {
      return NextResponse.json(
        { ...staleKvPayload, stale: true },
        { headers: mergeHeaders(getCacheHeaders('STALE'), rateLimitResult.headers) }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch Twitter data', code: 'TWITTER_UPSTREAM_ERROR' },
      { status: 502, headers: rateLimitResult.headers }
    );
  }
}
