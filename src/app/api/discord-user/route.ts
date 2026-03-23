import { NextResponse } from 'next/server';

const PROXY_BASE = 'https://camilo404.azurewebsites.net/v1';

const userCache = new Map<string, { data: unknown; cachedAt: number }>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${PROXY_BASE}/user/${encodeURIComponent(userId)}`, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Discord proxy error: ${response.status}`);
    }

    const data = await response.json();
    userCache.set(userId, { data, cachedAt: Date.now() });

    return NextResponse.json(
      { ...data, stale: false },
      {
        headers: {
          'Cache-Control': 's-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Discord User API error:', error);

    const cached = userCache.get(userId);
    if (cached) {
      return NextResponse.json(
        { ...(cached.data as Record<string, unknown>), stale: true },
        {
          headers: {
            'Cache-Control': 's-maxage=60, stale-while-revalidate=180',
          },
        }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch user data', code: 'DISCORD_UPSTREAM_ERROR' },
      { status: 500 }
    );
  }
} 