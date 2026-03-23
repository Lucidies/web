'use client';

import { useState, useEffect, useCallback } from 'react';
import { KovaaksData } from '@/lib/types';
import { ApiError, fetchJson } from '@/lib/api-client';
import { readLocalCache, writeLocalCache } from '@/lib/local-cache';

export function useKovaaks(searchUsername?: string | null) {
  const [data, setData] = useState<KovaaksData | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const isSearch = Boolean(searchUsername);
  const cacheKey = isSearch ? `kovaaks:search:${searchUsername!.toLowerCase()}` : 'kovaaks:default';

  // Load from local cache on mount or when search changes
  useEffect(() => {
    const cached = readLocalCache<KovaaksData>(cacheKey);
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

  const fetchKovaaksData = useCallback(async () => {
    setIsFetching(true);
    if (isSearch) setIsSearching(true);

    try {
      let url = '/api/kovaaks';
      if (isSearch && searchUsername) {
        // Detect if the input looks like a Steam ID (numeric, 17 digits, starts with 7656)
        const isSteamId = /^\d{17}$/.test(searchUsername) && searchUsername.startsWith('7656');
        if (isSteamId) {
          url = `/api/kovaaks?steamId=${encodeURIComponent(searchUsername)}`;
        } else {
          url = `/api/kovaaks?username=${encodeURIComponent(searchUsername)}`;
        }
      }

      const result = await fetchJson<KovaaksData>(url);
      setData(result);
      writeLocalCache(cacheKey, result);
      setError(null);
      setErrorCode(null);
      setRetryAfter(null);
      setIsStale(false);
      setLastUpdatedAt(Date.now());
    } catch (err) {
      const cached = readLocalCache<KovaaksData>(cacheKey);

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
  }, [cacheKey, isSearch, searchUsername]);

  const retry = useCallback(() => {
    fetchKovaaksData();
  }, [fetchKovaaksData]);

  useEffect(() => {
    fetchKovaaksData();

    // Only auto-refresh for default profile, not searches
    if (!isSearch) {
      const interval = setInterval(fetchKovaaksData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchKovaaksData, isSearch]);

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
    refetch: fetchKovaaksData,
    retry,
  };
}