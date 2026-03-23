'use client';

import Image from 'next/image';
import { OsuUser } from '@/lib/types';
import { BentoCard } from '@/components/ui/BentoCard';
import { getTimeAgo } from '@/lib/utils';

interface OsuProfileCardProps {
  user: OsuUser;
}

function formatPlayTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

export function OsuProfileCard({ user }: OsuProfileCardProps) {
  const stats = user.statistics;
  const lastActive = user.last_visit
    ? getTimeAgo(Math.floor(new Date(user.last_visit).getTime() / 1000))
    : 'Unknown';

  return (
    <BentoCard colSpan={4} className="osu-profile-card">
      {/* Cover Background */}
      <div className="osu-profile-cover">
        {user.cover_url && (
          <Image
            src={user.cover_url}
            alt="Profile Cover"
            className="osu-profile-cover-img"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            width={1200}
            height={320}
            unoptimized
          />
        )}
        <div className="osu-profile-cover-overlay" />
      </div>

      {/* Profile Content */}
      <div className="osu-profile-content">
        {/* Header: Avatar + Name */}
        <div className="osu-profile-header">
          <div className="osu-avatar-wrapper">
            <Image
              src={user.avatar_url}
              alt={user.username}
              className="osu-avatar"
              width={80}
              height={80}
              unoptimized
            />
            {user.is_online && <div className="osu-online-indicator" />}
          </div>
          <div className="osu-profile-info">
            <div className="osu-profile-name-row">
              <h1 className="osu-profile-name">{user.username}</h1>
              <Image
                src={`https://flagsapi.com/${user.country_code}/flat/24.png`}
                alt={user.country_code}
                className="osu-country-flag"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                width={20}
                height={14}
                unoptimized
              />
              <span className="osu-mode-badge">{user.playmode === 'osu' ? 'standard' : user.playmode}</span>
            </div>
            <div className="osu-profile-sub">
              <span>Level {stats.level.current}</span>
              <span className="osu-separator">•</span>
              <span>{formatPlayTime(stats.play_time)} played</span>
            </div>
            <div className="osu-profile-activity">
              <span className={`osu-activity-status ${user.is_online ? 'osu-status-online' : 'osu-status-offline'}`}>
                {user.is_online ? '● Online' : `Last active ${lastActive}`}
              </span>
              <span className="osu-separator">•</span>
              <span className="osu-join-date">Joined {formatDate(user.join_date)}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid - 3x2 layout */}
        <div className="osu-stats-grid">
          <div className="osu-stat-item">
            <span className="osu-stat-value">
              {stats.global_rank ? `#${stats.global_rank.toLocaleString()}` : 'N/A'}
            </span>
            <span className="osu-stat-label">Global Rank</span>
          </div>
          <div className="osu-stat-item">
            <span className="osu-stat-value">
              {stats.country_rank ? `#${stats.country_rank.toLocaleString()}` : 'N/A'}
            </span>
            <span className="osu-stat-label">Country Rank</span>
          </div>
          <div className="osu-stat-item">
            <span className="osu-stat-value">{Math.round(stats.pp).toLocaleString()}pp</span>
            <span className="osu-stat-label">Performance</span>
          </div>
          <div className="osu-stat-item">
            <span className="osu-stat-value">{stats.hit_accuracy.toFixed(2)}%</span>
            <span className="osu-stat-label">Accuracy</span>
          </div>
          <div className="osu-stat-item">
            <span className="osu-stat-value">{formatNumber(stats.play_count)}</span>
            <span className="osu-stat-label">Play Count</span>
          </div>
          <div className="osu-stat-item">
            <span className="osu-stat-value">{formatNumber(stats.maximum_combo)}</span>
            <span className="osu-stat-label">Max Combo</span>
          </div>
        </div>

        {/* Detailed Stats Table */}
        <div className="osu-detail-stats">
          <div className="osu-detail-row">
            <span className="osu-detail-label">Ranked Score</span>
            <span className="osu-detail-value">{stats.ranked_score.toLocaleString()}</span>
          </div>
          <div className="osu-detail-row">
            <span className="osu-detail-label">Total Score</span>
            <span className="osu-detail-value">{stats.total_score.toLocaleString()}</span>
          </div>
          <div className="osu-detail-row">
            <span className="osu-detail-label">Total Hits</span>
            <span className="osu-detail-value">{stats.total_hits.toLocaleString()}</span>
          </div>
          <div className="osu-detail-row">
            <span className="osu-detail-label">Replays Watched by Others</span>
            <span className="osu-detail-value">{stats.replays_watched_by_others.toLocaleString()}</span>
          </div>
        </div>

        {/* Bottom Row: Grades + Level */}
        <div className="osu-bottom-row">
          <div className="osu-grades-row">
            <div className="osu-grade osu-grade-ssh">
              <span className="osu-grade-icon">SS</span>
              <span className="osu-grade-count">{stats.grade_counts.ssh + stats.grade_counts.ss}</span>
            </div>
            <div className="osu-grade osu-grade-sh">
              <span className="osu-grade-icon">S</span>
              <span className="osu-grade-count">{stats.grade_counts.sh + stats.grade_counts.s}</span>
            </div>
            <div className="osu-grade osu-grade-a">
              <span className="osu-grade-icon">A</span>
              <span className="osu-grade-count">{stats.grade_counts.a}</span>
            </div>
          </div>

          {/* Level Circle */}
          <div className="osu-level-circle">
            <svg viewBox="0 0 60 60" className="osu-level-ring">
              <circle
                cx="30"
                cy="30"
                r="26"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />
              <circle
                cx="30"
                cy="30"
                r="26"
                fill="none"
                stroke="var(--osu-accent)"
                strokeWidth="3"
                strokeDasharray={`${(stats.level.progress / 100) * 163.36} 163.36`}
                strokeLinecap="round"
                transform="rotate(-90 30 30)"
              />
            </svg>
            <span className="osu-level-number">{stats.level.current}</span>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="osu-level-bar">
          <div className="osu-level-bar-fill" style={{ width: `${stats.level.progress}%` }} />
          <span className="osu-level-text">Lv{stats.level.current} — {stats.level.progress}%</span>
        </div>

        {/* Footer Info */}
        <div className="osu-profile-footer">
          <span>Joined {formatDate(user.join_date)}</span>
          <span className="osu-separator">·</span>
          <span className={user.is_online ? 'osu-status-online' : 'osu-status-offline'}>
            {user.is_online ? 'Currently online' : `Last active ${lastActive}`}
          </span>
          <span className="osu-separator">·</span>
          <span>Plays with Mouse, Keyboard, Tablet</span>
        </div>
      </div>
    </BentoCard>
  );
}
