'use client';

import Image from 'next/image';
import { OsuScore } from '@/lib/types';
import { BentoCard } from '@/components/ui/BentoCard';
import { getTimeAgo } from '@/lib/utils';

interface OsuRecentPlaysProps {
  scores: OsuScore[];
}

const RANK_COLORS: Record<string, string> = {
  XH: '#FFD700',
  X: '#FFD700',
  SH: '#FFFF00',
  S: '#FFFF00',
  A: '#22c55e',
  B: '#3b82f6',
  C: '#a855f7',
  D: '#ef4444',
  F: '#71717a',
};

const RANK_LABELS: Record<string, string> = {
  XH: 'SS',
  X: 'SS',
  SH: 'S',
  S: 'S',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  F: 'F',
};

function formatAccuracy(accuracy: number): string {
  return `${(accuracy * 100).toFixed(2)}%`;
}

export function OsuRecentPlays({ scores }: OsuRecentPlaysProps) {
  if (!scores || scores.length === 0) {
    return (
      <BentoCard colSpan={4}>
        <span className="text-label">Recent Plays</span>
        <div className="text-center py-8">
          <p className="text-gray-400">No recent plays found</p>
          <p className="text-sm text-gray-500">Play some osu! to see your recent scores</p>
        </div>
      </BentoCard>
    );
  }

  return (
    <BentoCard colSpan={4}>
      <span className="text-label mb-3">Recent Plays</span>
      <div className="osu-scores-list">
        {scores.map((score, index) => {
          const rankColor = RANK_COLORS[score.rank] || '#71717a';
          const rankLabel = RANK_LABELS[score.rank] || score.rank;
          const hasMisses = score.statistics.count_miss > 0;
          const timeAgo = score.created_at
            ? getTimeAgo(Math.floor(new Date(score.created_at).getTime() / 1000))
            : '';

          const coverUrl = score.beatmapset?.covers?.['list@2x'] || score.beatmapset?.covers?.list || '';
          const scoreUrl = `https://osu.ppy.sh/scores/${score.id}`;

          return (
            <div
              key={`${score.id || index}-${score.created_at}`}
              className={`osu-score-row ${!score.passed ? 'osu-score-failed' : ''}`}
              onClick={() => window.open(scoreUrl, '_blank')}
            >
              {/* Beatmap Cover */}
              <div className="osu-score-cover">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={score.beatmapset?.title || 'Beatmap'}
                    className="osu-score-cover-img"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"%3E%3Crect fill="%23333" width="60" height="60"/%3E%3C/svg%3E';
                    }}
                    width={56}
                    height={56}
                    unoptimized
                  />
                ) : (
                  <div className="osu-score-cover-placeholder" />
                )}
              </div>

              {/* Song Info */}
              <div className="osu-score-info">
                <div className="osu-score-title">{score.beatmapset?.title || 'Unknown'}</div>
                <div className="osu-score-artist">
                  {score.beatmapset?.artist || 'Unknown'}
                  <span className="osu-score-diff"> [{score.beatmap?.version}]</span>
                </div>
                <div className="osu-score-stars">
                  ★ {score.beatmap?.difficulty_rating?.toFixed(2)}
                  {score.mods && score.mods.length > 0 && (
                    <span className="osu-score-mods">
                      {score.mods.map((mod) => (
                        <span key={mod} className="osu-mod-badge">{mod}</span>
                      ))}
                    </span>
                  )}
                </div>
              </div>

              {/* Rank Grade */}
              <div className="osu-score-rank" style={{ color: rankColor }}>
                {rankLabel}
              </div>

              {/* Stats */}
              <div className="osu-score-stats">
                <div className="osu-score-accuracy">{formatAccuracy(score.accuracy)}</div>
                <div className="osu-score-combo">
                  {score.max_combo}x
                  {score.beatmap?.max_combo ? (
                    <span className="osu-score-max-combo">/{score.beatmap.max_combo}x</span>
                  ) : null}
                </div>
                <div className={`osu-score-misses ${hasMisses ? 'has-misses' : ''}`}>
                  {score.statistics.count_miss} miss{score.statistics.count_miss !== 1 ? 'es' : ''}
                </div>
              </div>

              {/* PP & Time */}
              <div className="osu-score-meta">
                {score.pp ? (
                  <div className="osu-score-pp">{Math.round(score.pp)}pp</div>
                ) : (
                  <div className="osu-score-pp osu-score-pp-none">—</div>
                )}
                {timeAgo && <div className="osu-score-time">{timeAgo}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </BentoCard>
  );
}
