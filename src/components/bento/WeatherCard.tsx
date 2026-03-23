'use client';

import { useWeather } from '@/hooks/useWeather';
import { BentoCard } from '@/components/ui/BentoCard';
import { MapPin, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Cloudy } from 'lucide-react';

function WeatherIcon({ description }: { description: string }) {
  const desc = description.toLowerCase();
  const iconClass = "w-8 h-8 opacity-60";

  if (desc.includes('clear') || desc.includes('sunny')) return <Sun className={iconClass} />;
  if (desc.includes('rain') || desc.includes('shower')) return <CloudRain className={iconClass} />;
  if (desc.includes('snow')) return <CloudSnow className={iconClass} />;
  if (desc.includes('thunder') || desc.includes('storm')) return <CloudLightning className={iconClass} />;
  if (desc.includes('drizzle')) return <CloudDrizzle className={iconClass} />;
  if (desc.includes('overcast') || desc.includes('cloudy')) return <Cloudy className={iconClass} />;
  if (desc.includes('cloud') || desc.includes('partly')) return <Cloud className={iconClass} />;
  return <Sun className={iconClass} />;
}

export function WeatherCard() {
  const { data, isLoading, isStale } = useWeather();

  return (
    <BentoCard colSpan={2} className="weather-card">
      <span className="text-label">Weather</span>
      {isLoading ? (
        <div className="weather-card-content">
          <div className="text-xs text-gray-500">Loading...</div>
        </div>
      ) : data ? (
        <div className="weather-card-content">
          <div className="weather-main">
            <div className="weather-temp">{data.temp}°C</div>
            <WeatherIcon description={data.description} />
          </div>
          <div className="weather-details">
            <span className="weather-description">{data.description}</span>
            <span className="weather-location">
              <MapPin className="w-3 h-3" />
              {data.location}
            </span>
            {isStale && (
              <span className="text-[10px] text-amber-300/80">Showing cached data</span>
            )}
          </div>
        </div>
      ) : (
        <span className="text-xs text-red-400">N/A</span>
      )}
    </BentoCard>
  );
}
