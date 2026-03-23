'use client';

import { useState, useEffect } from 'react';
import { fetchJson } from '@/lib/api-client';
import { readLocalCache, writeLocalCache } from '@/lib/local-cache';

interface WeatherData {
  temp: number;
  description: string;
  location: string;
  stale?: boolean;
}

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);

  const cacheKey = 'weather:current';

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const weatherData = await fetchJson<WeatherData>('/api/weather');
        setData(weatherData);
        writeLocalCache(cacheKey, weatherData);
        setError(null);
        setIsStale(Boolean(weatherData.stale));
      } catch (err) {
        const cached = readLocalCache<WeatherData>(cacheKey);
        if (cached) {
          setData(cached.data);
          setIsStale(true);
        }
        setError(err instanceof Error ? err : new Error('Failed to fetch weather'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return { data, error, isLoading, isStale };
}
