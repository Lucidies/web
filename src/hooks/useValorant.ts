'use client';

import { useState, useEffect, useCallback } from 'react';
import { ValorantData } from '@/lib/types';
import { ApiError, fetchJson } from '@/lib/api-client';
import { readLocalCache, writeLocalCache } from '@/lib/local-cache';

interface ValorantSearchParams {
  name: string;
  tag: string;
}

export function useValorant(searchParams?: ValorantSearchParams | null) {
  const [data, setData] = useState<ValorantData | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const isSearch = Boolean(searchParams);
  const cacheKey = isSearch
    ? `valorant:search:${searchParams!.name.toLowerCase()}:${searchParams!.tag.toLowerCase()}`
    : 'valorant:default';

  // Load from local cache on mount or when search changes
  useEffect(() => {
    const cached = readLocalCache<ValorantData>(cacheKey);
    if (!cached) {
      setData(null);
      setLastUpdatedAt(null);
      setIsStale(false);
      return;
    }

    setData(cached.data);
    setLastUpdatedAt(cached.savedAt);
    setIsStale(true);
    setIsFetching(false);
  }, [cacheKey]);

  const fetchValorantData = useCallback(async () => {
    setIsFetching(true);
    if (isSearch) setIsSearching(true);

    try {
      const url = isSearch
        ? `/api/valorant?name=${encodeURIComponent(searchParams!.name)}&tag=${encodeURIComponent(searchParams!.tag)}`
        : '/api/valorant';

      const result = await fetchJson<ValorantData>(url);
      setData(result);
      writeLocalCache(cacheKey, result);
      setError(null);
      setErrorCode(null);
      setRetryAfter(null);
      setIsStale(false);
      setLastUpdatedAt(Date.now());
    } catch (err) {
      const cached = readLocalCache<ValorantData>(cacheKey);

      if (cached) {
        setData(cached.data);
        setLastUpdatedAt(cached.savedAt);
        setIsStale(true);
      }

      if (err instanceof ApiError) {
        setError(err.message);
        setErrorCode(err.code ?? null);
        setRetryAfter(err.retryAfter ?? null);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setErrorCode(null);
        setRetryAfter(null);
      }
    } finally {
      setIsFetching(false);
      setIsSearching(false);
    }
  }, [cacheKey, isSearch, searchParams]);

  const retry = useCallback(() => {
    fetchValorantData();
  }, [fetchValorantData]);

  useEffect(() => {
    fetchValorantData();

    // Only auto-refresh for default profile, not searches
    if (!isSearch) {
      const interval = setInterval(fetchValorantData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchValorantData, isSearch]);

  return {
    data,
    loading: isFetching && !data,
    isFetching,
    error,
    errorCode,
    retryAfter,
    isStale,
    lastUpdatedAt,
    isSearching,
    refetch: fetchValorantData,
    retry,
  };
}
