'use client';

import { useState, useEffect } from 'react';
import type { SteamGame } from '@/lib/types';
import { fetchJson } from '@/lib/api-client';
import { readLocalCache, writeLocalCache } from '@/lib/local-cache';

export function useSteam() {
  const [games, setGames] = useState<SteamGame[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);

  const cacheKey = 'steam:games';

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const data = await fetchJson<{ games: SteamGame[]; stale?: boolean }>('/api/steam');
      setGames(data.games || []);
      writeLocalCache(cacheKey, data.games || []);
      setError(null);
      setIsStale(Boolean(data.stale));
    } catch (err) {
      const cached = readLocalCache<SteamGame[]>(cacheKey);
      if (cached) {
        setGames(cached.data);
        setIsStale(true);
      }
      setError(err instanceof Error ? err : new Error('Failed to fetch Steam data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  return { games, error, isLoading, isStale, refetch: fetchGames };
}
