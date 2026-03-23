import { NextResponse } from 'next/server';
import { LASTFM_USERNAME, LASTFM_API_KEY } from '@/lib/constants';

type LastFmResponse = {
  tracks: unknown[];
  stale?: boolean;
};

const lastFmCache = new Map<string, { data: LastFmResponse; cachedAt: number }>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';

    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=${limit}&extended=1`;
    
    const response = await fetch(url, {
      next: { revalidate: 180 },
    });

    if (!response.ok) {
      const retryAfter = response.headers.get('Retry-After');
      return NextResponse.json(
        {
          error: 'Failed to fetch Last.fm data',
          code: response.status === 429 ? 'RATE_LIMITED' : 'LASTFM_UPSTREAM_ERROR',
          retryAfter: retryAfter ? Number(retryAfter) : undefined,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.recenttracks || !data.recenttracks.track) {
      throw new Error('No tracks found');
    }

    const tracks = Array.isArray(data.recenttracks.track) 
      ? data.recenttracks.track 
      : [data.recenttracks.track];

    const payload: LastFmResponse = { tracks, stale: false };
    lastFmCache.set(limit, { data: payload, cachedAt: Date.now() });

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=180',
      },
    });
  } catch (error) {
    console.error('Last.fm API error:', error);

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const cached = lastFmCache.get(limit);

    if (cached) {
      return NextResponse.json(
        { ...cached.data, stale: true },
        {
          headers: {
            'Cache-Control': 's-maxage=30, stale-while-revalidate=120',
          },
        }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch Last.fm data', code: 'LASTFM_UPSTREAM_ERROR' },
      { status: 500 }
    );
  }
}
