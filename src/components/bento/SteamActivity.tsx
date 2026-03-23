'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useSteam } from '@/hooks/useSteam';
import { BentoCard } from '@/components/ui/BentoCard';

const STEAM_ICON_FALLBACK =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22 viewBox=%220 0 48 48%22%3E%3Crect fill=%22%23333%22 width=%2248%22 height=%2248%22/%3E%3C/svg%3E';

function SteamGameIcon({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  return (
    <Image
      src={hasError ? STEAM_ICON_FALLBACK : src}
      alt={alt}
      className="steam-game-icon"
      width={48}
      height={48}
      unoptimized
      onError={() => setHasError(true)}
    />
  );
}

export function SteamActivity() {
  const { games, error, isLoading, isStale } = useSteam();

  return (
    <BentoCard colSpan={2}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Image
            src="https://cdn.simpleicons.org/steam/white"
            alt="Steam"
            className="w-4 h-4 opacity-60"
            width={16}
            height={16}
            unoptimized
          />
          <span className="text-label mb-0">Steam Activity</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="text-xs text-gray-600 italic">Loading games...</div>
        ) : error && games.length === 0 ? (
          <div className="text-xs text-red-400 italic">Could not load Steam activity.</div>
        ) : games.length === 0 ? (
          <div className="text-xs text-gray-600 italic">
            No recent games. Make sure your Steam profile&apos;s &quot;Game details&quot; is set to
            Public.
          </div>
        ) : (
          games.map((game) => {
            const hours = Math.floor(game.playtime_forever / 60);
            const iconUrl = `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`;

            return (
              <div
                key={game.appid}
                className="steam-game-item"
                onClick={() => window.open(`https://store.steampowered.com/app/${game.appid}`, '_blank')}
              >
                <SteamGameIcon src={iconUrl} alt={game.name} />
                <div className="steam-game-info">
                  <div className="steam-game-name">{game.name}</div>
                  <div className="steam-game-hours">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {hours} hrs total hours
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {isStale && (
        <div className="mt-2 text-[10px] text-amber-300/80">Showing cached Steam data</div>
      )}
    </BentoCard>
  );
}
