'use client';

import Image from 'next/image';
import { useState, useEffect, useSyncExternalStore, useCallback } from 'react';
import { useLanyard } from '@/hooks/useLanyard';
import { BentoCard } from '@/components/ui/BentoCard';
import { formatTime, getActivityImageUrl } from '@/lib/utils';
import { Music, Gamepad2, Play, Radio, Trophy } from 'lucide-react';

interface SavedActivity {
  name: string;
  details: string;
  state: string;
  image_url: string | null;
  type: number;
}

interface SavedSpotify {
  song: string;
  artist: string;
  album: string;
  album_art_url: string;
}

// Activity type labels and icons
const ACTIVITY_TYPES: Record<number, { label: string; icon: typeof Music }> = {
  0: { label: 'Playing', icon: Gamepad2 },
  1: { label: 'Streaming', icon: Radio },
  2: { label: 'Listening to', icon: Music },
  3: { label: 'Watching', icon: Play },
  5: { label: 'Competing in', icon: Trophy },
};

function readLocalStorageItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

const subscribeNoop = () => () => {};

export function ActivityCard() {
  const { data } = useLanyard();
  const hasHydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [currentTime, setCurrentTime] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Reset image error when activity changes
  const activityId = data?.activities?.find((a) => a.type !== 4)?.id;
  const spotifyTrack = data?.spotify?.track_id;
  useEffect(() => { setImgError(false); }, [activityId, spotifyTrack]);

  const handleImgError = useCallback(() => { setImgError(true); }, []);
  const cachedSpotify = hasHydrated
    ? readLocalStorageItem<SavedSpotify>('lastSpotifySong')
    : null;
  const cachedActivity = hasHydrated
    ? readLocalStorageItem<SavedActivity>('lastActivity')
    : null;

  // Update current time for progress calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save current activities
  useEffect(() => {
    if (!hasHydrated) return;

    if (data?.listening_to_spotify && data.spotify) {
      const spotifyData = {
        song: data.spotify.song,
        artist: data.spotify.artist,
        album: data.spotify.album,
        album_art_url: data.spotify.album_art_url,
      };
      window.localStorage.setItem('lastSpotifySong', JSON.stringify(spotifyData));
    }

    if (data?.activities && data.activities.length > 0) {
      const activity = data.activities.find((a) => a.type !== 4);
      if (activity) {
        const activityData: SavedActivity = {
          name: activity.name,
          details: activity.details || '',
          state: activity.state || '',
          image_url: getActivityImageUrl(activity),
          type: activity.type,
        };
        window.localStorage.setItem('lastActivity', JSON.stringify(activityData));
      }
    }
  }, [hasHydrated, data]);

  // Determine what to display
  let content: {
    image: string | null;
    title: string;
    subtitle: string;
    detail: string;
    label: string;
    isLive: boolean;
  } | null = null;
  let showProgress = false;
  let progress = 0;
  let timeStart = '0:00';
  let timeEnd = '0:00';
  let isSpotify = false;
  let elapsedStr = '';
  let ActivityIcon = Music;

  if (data?.listening_to_spotify && data.spotify) {
    // Currently playing Spotify
    const total = data.spotify.timestamps.end - data.spotify.timestamps.start;
    const elapsed = currentTime - data.spotify.timestamps.start;
    progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    timeStart = formatTime(elapsed);
    timeEnd = formatTime(total);
    showProgress = true;
    isSpotify = true;

    content = {
      image: data.spotify.album_art_url,
      title: data.spotify.song,
      subtitle: data.spotify.artist,
      detail: data.spotify.album || '',
      label: 'Now Playing',
      isLive: true,
    };
  } else if (data?.activities && data.activities.length > 0) {
    // Currently doing other activity
    const activity = data.activities.find((a) => a.type !== 4);
    if (activity) {
      const actType = ACTIVITY_TYPES[activity.type] || { label: 'Playing', icon: Gamepad2 };
      ActivityIcon = actType.icon;

      content = {
        image: getActivityImageUrl(activity),
        title: activity.name,
        subtitle: activity.details || '',
        detail: activity.state || '',
        label: `${actType.label} ${activity.name}`,
        isLive: true,
      };

      if (activity.timestamps?.start && activity.timestamps?.end) {
        const total = activity.timestamps.end - activity.timestamps.start;
        const elapsed = currentTime - activity.timestamps.start;
        progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
        timeStart = formatTime(elapsed);
        timeEnd = formatTime(total);
        showProgress = true;
      } else if (activity.timestamps?.start) {
        // Show elapsed time only
        const elapsed = currentTime - activity.timestamps.start;
        const hrs = Math.floor(elapsed / 3600000);
        const mins = Math.floor((elapsed % 3600000) / 60000);
        const secs = Math.floor((elapsed % 60000) / 1000);
        if (hrs > 0) {
          elapsedStr = `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} elapsed`;
        } else {
          elapsedStr = `${mins}:${secs.toString().padStart(2, '0')} elapsed`;
        }
      }
    }
  } else if (cachedSpotify) {
    // Show last Spotify song
    isSpotify = true;
    content = {
      image: cachedSpotify.album_art_url,
      title: cachedSpotify.song,
      subtitle: cachedSpotify.artist,
      detail: cachedSpotify.album || '',
      label: 'Last Played',
      isLive: false,
    };
  } else if (cachedActivity) {
    // Show last activity
    const actType = ACTIVITY_TYPES[cachedActivity.type] || { label: 'Playing', icon: Gamepad2 };
    ActivityIcon = actType.icon;
    content = {
      image: cachedActivity.image_url,
      title: cachedActivity.name,
      subtitle: cachedActivity.details || '',
      detail: cachedActivity.state || '',
      label: `Last Activity`,
      isLive: false,
    };
  }

  return (
    <BentoCard colSpan={3} className="activity-card">
      {/* Header label */}
      <div className="activity-header">
        <span className="text-label mb-0">
          {content?.label || (isSpotify ? 'Now Playing' : 'Activity')}
        </span>
      </div>

      {content ? (
        <div className="activity-wrapper">
          {/* Album art / Activity image */}
          <div className="activity-art-wrapper">
            {content.image && !imgError ? (
              <>
                <Image
                  src={content.image}
                  width={96}
                  height={96}
                  className="activity-art"
                  alt=""
                  unoptimized
                  onError={handleImgError}
                />
                <div className="activity-art-border" />
              </>
            ) : (
              <div className="activity-art-placeholder">
                {isSpotify ? <Music className="w-6 h-6 opacity-40" /> : <ActivityIcon className="w-6 h-6 opacity-40" />}
              </div>
            )}
            {/* Small icon overlay for activity type */}
            {!isSpotify && content.isLive && (
              <div className="activity-type-badge">
                <ActivityIcon className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="activity-info">
            <div className="song-title">{isSpotify ? content.title : (content.subtitle || content.title)}</div>
            <div className="song-artist">
              {isSpotify ? content.subtitle : (content.detail || content.title)}
            </div>
            {/* Show album name for Spotify or extra detail */}
            {isSpotify && content.detail && (
              <div className="activity-detail">{content.detail}</div>
            )}

            {/* Progress bar for Spotify / timed activities */}
            {showProgress && (
              <div className="activity-progress-section">
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="activity-timestamps">
                  <span>{timeStart}</span>
                  <span>{timeEnd}</span>
                </div>
              </div>
            )}

            {/* Elapsed time for activities without end time */}
            {!showProgress && elapsedStr && (
              <div className="activity-elapsed">{elapsedStr}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="activity-empty">
          <Music className="w-5 h-5 opacity-30" />
          <span>No activity</span>
        </div>
      )}
    </BentoCard>
  );
}
