'use client';

import type { KovaaksUserProfile, KovaaksBenchmarkProgress, KovaaksVtEnergyResult } from '@/lib/types';
import { Zap, Trophy, User } from 'lucide-react';

const RANK_COLORS: Record<string, string> = {
  'Unranked': '#6b7280',
  'Iron': '#999999',
  'Bronze': '#FF9900',
  'Silver': '#CBD9E6',
  'Gold': '#CAB148',
  'Platinum': '#2FCFC2',
  'Diamond': '#B9F2FF',
  'Jade': '#85FA85',
  'Master': '#EC44CA',
  'Grandmaster': '#FFD700',
  'Nova': '#7900FF',
  'Astra': '#FF2262',
  'Celestial': '#24DDD8',
  'Stellaris': '#979DDA',
  'Lunara': '#54418E',
  'Solara': '#FCFFA0',
};

function getRankColor(rankName: string): string {
  for (const [key, color] of Object.entries(RANK_COLORS)) {
    if (rankName.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#888888';
}

interface KovaaksProfileCardProps {
  profile: KovaaksUserProfile;
  benchmarks: KovaaksBenchmarkProgress | null;
  allBenchmarks?: Record<string, KovaaksBenchmarkProgress | null>;
  bestVtEnergy?: KovaaksVtEnergyResult | null;
}

export function KovaaksProfileCard({ profile, bestVtEnergy }: KovaaksProfileCardProps) {
  // Use VT-Energy rank as the primary rank display
  const rankName = bestVtEnergy?.rankName || 'Unranked';
  const harmonicMean = bestVtEnergy?.harmonicMean ?? 0;
  const difficultyName = bestVtEnergy?.difficultyName || '';

  const rankColor = getRankColor(rankName);

  return (
    <div className="bento-card col-span-4 relative overflow-hidden !p-5">
      <div className="relative z-10">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="kvk-profile-avatar">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.webAppUsername}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <User size={28} className="text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              {profile.webAppUsername}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="kvk-rank-badge" style={{ color: rankColor, borderColor: `${rankColor}40`, background: `${rankColor}15` }}>
                {rankName}
              </span>
              {difficultyName && (
                <span className="text-xs text-gray-500">
                  {difficultyName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row - Only VT Energy and Voltaic Rank */}
        <div className="kvk-stats-row">
          <div className="kvk-stat-card">
            <Zap size={14} className="text-gray-400" />
            <div>
              <div className="kvk-stat-value">{harmonicMean > 0 ? harmonicMean.toFixed(1) : '—'}</div>
              <div className="kvk-stat-label">VT Energy</div>
            </div>
          </div>
          <div className="kvk-stat-card">
            <Trophy size={14} style={{ color: rankColor }} />
            <div>
              <div className="kvk-stat-value" style={{ color: rankColor }}>{rankName}</div>
              <div className="kvk-stat-label">Voltaic Rank</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}