'use client';

import { useState, useEffect } from 'react';
import { DISCORD_ID } from '@/lib/constants';
import type { DiscordUserProfile } from '@/lib/types';
import { fetchJson } from '@/lib/api-client';
import { readLocalCache, writeLocalCache } from '@/lib/local-cache';

export function useDiscordUser() {
  const [data, setData] = useState<DiscordUserProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);

  const cacheKey = `discord-user:${DISCORD_ID}`;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const json = await fetchJson<DiscordUserProfile & { stale?: boolean }>(
          `/api/discord-user?id=${DISCORD_ID}`
        );
        setData(json);
        writeLocalCache(cacheKey, json);
        setError(null);
        setIsStale(Boolean(json.stale));
      } catch (err) {
        const cached = readLocalCache<DiscordUserProfile>(cacheKey);
        if (cached) {
          setData(cached.data);
          setIsStale(true);
        }
        setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchUserData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [cacheKey]);

  return { data, error, isLoading, isStale };
}
