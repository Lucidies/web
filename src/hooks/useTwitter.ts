'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TwitterData } from '@/lib/types';
import { ApiError, fetchJson } from '@/lib/api-client';
import { readLocalCache, writeLocalCache } from '@/lib/local-cache';

export function useTwitter(searchUsername?: string | null) {
  const [data, setData] = useState<TwitterData | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const isSearch = Boolean(searchUsername);
  const cacheKey = isSearch ? `twitter:search:${searchUsername!.toLowerCase()}` : 'twitter:default';

  // Track previous cacheKey to detect changes
  const prevCacheKeyRef = useRef(cacheKey);

  // When search changes, immediately reset state so stale data never shows
  useEffect(() => {
    if (prevCacheKeyRef.current !== cacheKey) {
      prevCacheKeyRef.current = cacheKey;

      // Clear previous data and errors immediately
      setError(null);
      setErrorCode(null);
      setRetryAfter(null);
      setIsStale(false);

      // Try to load from local cache for the new key
      const cached = readLocalCache<TwitterData>(cacheKey);
      if (cached) {
        setData(cached.data);
        setLastUpdatedAt(cached.savedAt);
        setIsStale(true);
      } else {
        setData(null);
        setLastUpdatedAt(null);
      }

      // Mark as fetching so loading spinner shows
      setIsFetching(true);
      if (isSearch) setIsSearching(true);
    }
  }, [cacheKey, isSearch]);

  // Load from local cache on initial mount only
  useEffect(() => {
    const cached = readLocalCache<TwitterData>(cacheKey);
    if (cached) {
      setData(cached.data);
      setLastUpdatedAt(cached.savedAt);
      setIsStale(true);
      setIsFetching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const fetchTwitterData = useCallback(async () => {
    setIsFetching(true);
    if (isSearch) setIsSearching(true);

    try {
      let url = '/api/twitter';
      if (isSearch && searchUsername) {
        url = `/api/twitter?username=${encodeURIComponent(searchUsername)}`;
      }

      const result = await fetchJson<TwitterData>(url);
      setData(result);
      writeLocalCache(cacheKey, result);
      setError(null);
      setErrorCode(null);
      setRetryAfter(null);
      setIsStale(false);
      setLastUpdatedAt(Date.now());
    } catch (err) {
      const cached = readLocalCache<TwitterData>(cacheKey);

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
    fetchTwitterData();
  }, [fetchTwitterData]);

  useEffect(() => {
    fetchTwitterData();

    // Only auto-refresh for default profile, not searches
    if (!isSearch) {
      const interval = setInterval(fetchTwitterData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchTwitterData, isSearch]);

  const loading = isFetching && !data;

  return {
    data,
    loading,
    isFetching,
    error,
    errorCode,
    retryAfter,
    isStale,
    isSearching,
    lastUpdatedAt,
    retry,
  };
}
