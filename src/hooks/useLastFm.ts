'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LastFmTrack } from '@/lib/types';
import { fetchJson } from '@/lib/api-client';
import { readLocalCache, writeLocalCache } from '@/lib/local-cache';

export function useLastFm(limit: number = 10) {
  const [tracks, setTracks] = useState<LastFmTrack[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);

  const cacheKey = `lastfm:tracks:${limit}`;

  const fetchTracks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchJson<{ tracks: LastFmTrack[]; stale?: boolean }>(`/api/lastfm?limit=${limit}`);
      setTracks(data.tracks || []);
      writeLocalCache(cacheKey, data.tracks || []);
      setError(null);
      setIsStale(Boolean(data.stale));
    } catch (err) {
      const cached = readLocalCache<LastFmTrack[]>(cacheKey);
      if (cached) {
        setTracks(cached.data);
        setIsStale(true);
      }
      setError(err instanceof Error ? err : new Error('Failed to fetch Last.fm data'));
    } finally {
      setIsLoading(false);
    }
  }, [limit, cacheKey]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  return { tracks, error, isLoading, isStale, refetch: fetchTracks };
}
