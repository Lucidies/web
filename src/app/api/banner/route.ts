import { NextRequest, NextResponse } from 'next/server';

const PROXY_BASE = 'https://camilo404.azurewebsites.net/v1';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
  }

  try {
    const imageResponse = await fetch(`${PROXY_BASE}/banner/${encodeURIComponent(userId)}`, {
      next: { revalidate: 300 },
    });

    if (!imageResponse.ok) {
      if (imageResponse.status === 404) {
        return NextResponse.json({ error: 'User has no banner' }, { status: 404 });
      }
      throw new Error(`Proxy banner error: ${imageResponse.status}`);
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    const buffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl });
  } catch (error) {
    console.error('Discord Banner API error:', error);
    return NextResponse.json({ error: 'Failed to fetch banner' }, { status: 500 });
  }
}