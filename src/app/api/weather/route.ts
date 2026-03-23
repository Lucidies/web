import { NextResponse } from 'next/server';
import { WEATHER_LOCATION } from '@/lib/constants';
import { WEATHER_CODES } from '@/lib/constants';

interface WeatherPayload {
  temp: number;
  description: string;
  location: string;
  stale?: boolean;
}

let weatherCache: { data: WeatherPayload; cachedAt: number } | null = null;

export async function GET() {
  try {
    // Get coordinates for the location
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(WEATHER_LOCATION)}&count=1&language=en&format=json`,
      { next: { revalidate: 3600 } }
    );

    if (!geoResponse.ok) {
      throw new Error(`Geocoding request failed: ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error('City not found');
    }

    const { latitude, longitude, name } = geoData.results[0];

    // Get weather data
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`,
      { next: { revalidate: 600 } }
    );

    if (!weatherResponse.ok) {
      throw new Error(`Weather request failed: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();

    const temp = Math.round(weatherData.current.temperature_2m);
    const code = weatherData.current.weather_code;
    const description = WEATHER_CODES[code] || 'Cloudy';

    const payload: WeatherPayload = {
      temp,
      description,
      location: name || WEATHER_LOCATION,
      stale: false,
    };

    weatherCache = { data: payload, cachedAt: Date.now() };

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 's-maxage=120, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Weather API error:', error);

    if (weatherCache) {
      return NextResponse.json(
        { ...weatherCache.data, stale: true },
        {
          headers: {
            'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
          },
        }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch weather data', code: 'WEATHER_UPSTREAM_ERROR' },
      { status: 500 }
    );
  }
}
