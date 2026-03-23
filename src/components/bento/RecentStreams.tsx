'use client';

import Image from 'next/image';
import { useLastFm } from '@/hooks/useLastFm';
import { BentoCard } from '@/components/ui/BentoCard';
import { getTimeAgo, formatDuration } from '@/lib/utils';

export function RecentStreams() {
  const { tracks, error, isLoading, isStale } = useLastFm(10);

  return (
    <BentoCard colSpan={2}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Image
            src="https://cdn.simpleicons.org/spotify/white"
            alt="Spotify"
            className="w-4 h-4 opacity-60"
            width={16}
            height={16}
            unoptimized
          />
          <span className="text-label mb-0">Recent Streams</span>
        </div>
      </div>

      <div className="tracks-list">
        {isLoading ? (
          <div className="text-sm text-gray-500 italic">Loading history...</div>
        ) : error && tracks.length === 0 ? (
          <div className="text-xs text-red-400 p-2">Could not load recent streams.</div>
        ) : tracks.length === 0 ? (
          <div className="text-xs text-gray-500 p-2">No recent tracks</div>
        ) : (
          tracks
            .filter((track) => !track['@attr']?.nowplaying)
            .map((track, index) => {
              const trackName = track.name || 'Unknown';
              const artistName = track.artist?.['#text'] || track.artist?.name || 'Unknown';

              // Last.fm default "no art" placeholder hash
              const LASTFM_DEFAULT_HASH = '2a96cbd8b46e442fc41c2b86b821562f';
              const FALLBACK_ART =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%231a1a1a" width="200" height="200" rx="8"/%3E%3Ccircle cx="100" cy="90" r="35" fill="none" stroke="%23444" stroke-width="2"/%3E%3Ccircle cx="100" cy="90" r="8" fill="%23444"/%3E%3Crect x="60" y="140" width="80" height="6" rx="3" fill="%23333"/%3E%3Crect x="75" y="155" width="50" height="4" rx="2" fill="%23292929"/%3E%3C/svg%3E';

              let albumArt = '';
              if (track.image && Array.isArray(track.image)) {
                const img = track.image.find((img) => img.size === 'large') || track.image[0];
                albumArt = img?.['#text'] || '';
              }

              // Detect Last.fm default placeholder and replace with dark themed one
              if (!albumArt || albumArt.includes(LASTFM_DEFAULT_HASH)) {
                albumArt = FALLBACK_ART;
              }

              const trackUrl =
                track.url ||
                `https://www.last.fm/music/${encodeURIComponent(artistName)}/_/${encodeURIComponent(trackName)}`;

              const timeAgo = track.date?.uts ? getTimeAgo(parseInt(track.date.uts)) : '';
              const duration = track.duration ? formatDuration(parseInt(track.duration)) : '';

              const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(trackName + ' ' + artistName)}`;

              return (
                <div
                  key={`${trackName}-${artistName}-${index}`}
                  className="track-row"
                  onClick={() => window.open(trackUrl, '_blank')}
                >
                  <Image
                    src={albumArt}
                    alt={trackName}
                    className="track-album-art"
                    width={48}
                    height={48}
                    unoptimized
                  />
                  <div className="track-info">
                    <div className="track-name">{trackName}</div>
                    <div className="track-artist">{artistName}</div>
                  </div>
                  <div className="track-meta">
                    {duration && <div className="track-duration">{duration}</div>}
                    {timeAgo && <div className="track-time-ago">{timeAgo}</div>}
                  </div>
                  <div className="track-actions">
                    <a
                      href={spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="track-spotify-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                    </a>
                  </div>
                </div>
              );
            })
        )}
      </div>
      {isStale && (
        <div className="mt-2 text-[10px] text-amber-300/80">Showing cached stream data</div>
      )}
    </BentoCard>
  );
}
