import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for Twitter video URLs to bypass CORS restrictions.
 * Only allows proxying from video.twimg.com to prevent abuse.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Only allow proxying Twitter video CDN URLs
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const allowedHosts = ['video.twimg.com', 'pbs.twimg.com'];
  if (!allowedHosts.includes(parsedUrl.hostname)) {
    return NextResponse.json(
      { error: 'Only Twitter video URLs are allowed' },
      { status: 403 }
    );
  }

  try {
    // Support range requests for video seeking
    const headers: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Referer: 'https://x.com/',
    };

    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok && response.status !== 206) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: response.status >= 500 ? 502 : response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');
    const acceptRanges = response.headers.get('accept-ranges');

    const responseHeaders: HeadersInit = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    };

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange;
    }
    if (acceptRanges) {
      responseHeaders['Accept-Ranges'] = acceptRanges;
    } else {
      responseHeaders['Accept-Ranges'] = 'bytes';
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Twitter Video Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 502 }
    );
  }
}
