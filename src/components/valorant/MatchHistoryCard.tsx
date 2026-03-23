'use client';

import { useState } from 'react';
import { ValorantMatch, ValorantMatchPlayer } from "@/lib/types";
import Image from "next/image";

interface MatchHistoryCardProps {
  matches: ValorantMatch[];
  playerPuuid: string;
  loading?: boolean;
}

const RANK_ICON_BASE = 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04';

function formatModeName(mode: string): string {
  const modeMap: Record<string, string> = {
    'competitive': 'Competitive',
    'unrated': 'Unrated',
    'swiftplay': 'Swiftplay',
    'spikerush': 'Spike Rush',
    'deathmatch': 'Deathmatch',
    'escalation': 'Escalation',
    'replication': 'Replication',
    'snowball fight': 'Snowball Fight',
    'team deathmatch': 'Team DM',
    'premier': 'Premier',
  };
  return modeMap[mode.toLowerCase()] || mode;
}

function getModeColor(mode: string): string {
  switch (mode.toLowerCase()) {
    case 'competitive': return 'val-mode-competitive';
    case 'unrated': return 'val-mode-unrated';
    case 'swiftplay': return 'val-mode-swiftplay';
    case 'deathmatch': return 'val-mode-deathmatch';
    case 'team deathmatch': return 'val-mode-deathmatch';
    default: return 'val-mode-other';
  }
}

function PlayerRow({ player, isCurrentPlayer }: { player: ValorantMatchPlayer; isCurrentPlayer: boolean }) {
  const rankTier = player.currenttier;
  const hasRank = rankTier && rankTier > 0;

  return (
    <div className={`val-player-row ${isCurrentPlayer ? 'val-player-current' : ''}`}>
      <div className="val-player-agent">
        <Image
          src={player.assets.agent.small}
          alt={player.character}
          width={32}
          height={32}
          className="rounded"
        />
      </div>
      <div className="val-player-name">
        <span className={`val-player-username ${isCurrentPlayer ? 'text-white font-semibold' : 'text-gray-300'}`}>
          {player.name}
        </span>
        <span className="val-player-tag">#{player.tag}</span>
      </div>
      <div className="val-player-rank">
        {hasRank ? (
          <Image
            src={`${RANK_ICON_BASE}/${rankTier}/smallicon.png`}
            alt={player.currenttier_patched || `Tier ${rankTier}`}
            width={20}
            height={20}
            className="val-rank-icon"
            title={player.currenttier_patched || undefined}
          />
        ) : (
          <span className="text-xs text-gray-600">—</span>
        )}
      </div>
      <div className="val-player-kda">
        <span className="val-kda-kills">{player.stats.kills}</span>
        <span className="val-kda-separator">/</span>
        <span className="val-kda-deaths">{player.stats.deaths}</span>
        <span className="val-kda-separator">/</span>
        <span className="val-kda-assists">{player.stats.assists}</span>
      </div>
    </div>
  );
}

function MatchDetail({ match, playerPuuid }: { match: ValorantMatch; playerPuuid: string }) {
  const isDeathmatch = match.metadata.mode.toLowerCase() === 'deathmatch' || match.metadata.mode.toLowerCase() === 'team deathmatch';

  if (isDeathmatch) {
    // Deathmatch: single list sorted by kills
    const allPlayers = [...match.players.all_players].sort((a, b) => b.stats.kills - a.stats.kills);

    return (
      <div className="val-match-detail">
        <div className="val-dm-list">
          <div className="val-dm-header">
            <span className="val-team-name">All Players</span>
            <span className="text-xs text-gray-500">Sorted by Kills</span>
          </div>
          <div className="val-team-players">
            {allPlayers.map((player, index) => (
              <div key={player.puuid} className={`val-player-row ${player.puuid === playerPuuid ? 'val-player-current' : ''}`}>
                <span className={`val-dm-placement ${index < 3 ? 'text-yellow-400' : 'text-gray-500'}`}>
                  #{index + 1}
                </span>
                <div className="val-player-agent">
                  <Image
                    src={player.assets.agent.small}
                    alt={player.character}
                    width={32}
                    height={32}
                    className="rounded"
                  />
                </div>
                <div className="val-player-name">
                  <span className={`val-player-username ${player.puuid === playerPuuid ? 'text-white font-semibold' : 'text-gray-300'}`}>
                    {player.name}
                  </span>
                  <span className="val-player-tag">#{player.tag}</span>
                </div>
                <div className="val-player-rank">
                  {player.currenttier && player.currenttier > 0 ? (
                    <Image
                      src={`${RANK_ICON_BASE}/${player.currenttier}/smallicon.png`}
                      alt={player.currenttier_patched || `Tier ${player.currenttier}`}
                      width={20}
                      height={20}
                      className="val-rank-icon"
                      title={player.currenttier_patched || undefined}
                    />
                  ) : (
                    <span className="text-xs text-gray-600">—</span>
                  )}
                </div>
                <div className="val-player-kda">
                  <span className="val-kda-kills">{player.stats.kills}</span>
                  <span className="val-kda-separator">/</span>
                  <span className="val-kda-deaths">{player.stats.deaths}</span>
                  <span className="val-kda-separator">/</span>
                  <span className="val-kda-assists">{player.stats.assists}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Team-based modes: two-column layout
  const redPlayers = match.players.red || [];
  const bluePlayers = match.players.blue || [];
  
  // Sort players by ACS (score) descending within each team
  const sortedRed = [...redPlayers].sort((a, b) => b.stats.score - a.stats.score);
  const sortedBlue = [...bluePlayers].sort((a, b) => b.stats.score - a.stats.score);

  const redWon = match.teams.red?.has_won || false;
  const blueWon = match.teams.blue?.has_won || false;

  return (
    <div className="val-match-detail">
      <div className="val-match-teams">
        {/* Team Red/Attackers */}
        <div className="val-team-column">
          <div className={`val-team-header ${redWon ? 'val-team-won' : 'val-team-lost'}`}>
            <span className="val-team-name">
              {redWon ? '★ ' : ''}Team Red
            </span>
            <span className="val-team-score">{match.teams.red?.rounds_won || 0}</span>
          </div>
          <div className="val-team-players">
            {sortedRed.map((player) => (
              <PlayerRow
                key={player.puuid}
                player={player}
                isCurrentPlayer={player.puuid === playerPuuid}
              />
            ))}
          </div>
        </div>

        {/* Team Blue/Defenders */}
        <div className="val-team-column">
          <div className={`val-team-header ${blueWon ? 'val-team-won' : 'val-team-lost'}`}>
            <span className="val-team-name">
              {blueWon ? '★ ' : ''}Team Blue
            </span>
            <span className="val-team-score">{match.teams.blue?.rounds_won || 0}</span>
          </div>
          <div className="val-team-players">
            {sortedBlue.map((player) => (
              <PlayerRow
                key={player.puuid}
                player={player}
                isCurrentPlayer={player.puuid === playerPuuid}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MatchHistoryCard({
  matches,
  playerPuuid,
  loading,
}: MatchHistoryCardProps) {
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bento-card col-span-4">
        <h2 className="text-xl font-semibold mb-4">Match History</h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-800/50 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="bento-card col-span-4">
        <h2 className="text-xl font-semibold mb-4">Match History</h2>
        <p className="text-gray-400 text-center py-8">
          No recent matches found
        </p>
      </div>
    );
  }

  return (
    <div className="bento-card col-span-4 !p-4">
      <h2 className="text-lg font-semibold mb-3">Match History</h2>
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
        {matches.map((match) => {
          const player = match.players.all_players.find(
            (p) => p.puuid === playerPuuid
          );
          if (!player) return null;

          const isDeathmatch = match.metadata.mode.toLowerCase() === 'deathmatch' || match.metadata.mode.toLowerCase() === 'team deathmatch';
          const playerTeam = player.team.toLowerCase() as "red" | "blue";
          const won = isDeathmatch ? false : (match.teams[playerTeam]?.has_won || false);
          const teamScore = isDeathmatch ? 0 : (match.teams[playerTeam]?.rounds_won || 0);
          const enemyTeam = playerTeam === "red" ? "blue" : "red";
          const enemyScore = isDeathmatch ? 0 : (match.teams[enemyTeam]?.rounds_won || 0);
          const isExpanded = expandedMatchId === match.metadata.matchid;
          
          // For deathmatch, determine placement by kills
          const dmPlacement = isDeathmatch
            ? [...match.players.all_players].sort((a, b) => b.stats.kills - a.stats.kills).findIndex(p => p.puuid === playerPuuid) + 1
            : 0;
          const dmWon = isDeathmatch && dmPlacement <= 3;

          const kd =
            player.stats.deaths > 0
              ? (player.stats.kills / player.stats.deaths).toFixed(2)
              : player.stats.kills.toFixed(2);

          const totalShots =
            player.stats.headshots +
            player.stats.bodyshots +
            player.stats.legshots;
          const hsPercentage =
            totalShots > 0
              ? ((player.stats.headshots / totalShots) * 100).toFixed(0)
              : "0";

          return (
            <div key={match.metadata.matchid} className="val-match-wrapper">
              <div
                className={`val-match-row ${isDeathmatch ? (dmWon ? 'val-match-won' : 'val-match-neutral') : (won ? 'val-match-won' : 'val-match-lost')} ${isExpanded ? 'val-match-expanded' : ''}`}
                onClick={() => setExpandedMatchId(isExpanded ? null : match.metadata.matchid)}
              >
                {/* Agent Icon */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                  <Image
                    src={player.assets.agent.small}
                    alt={player.character}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Match Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {isDeathmatch ? (
                      <>
                        <span className={`font-bold text-sm ${dmWon ? 'text-green-400' : 'text-gray-300'}`}>
                          #{dmPlacement}
                        </span>
                        <span className="text-gray-400 text-xs">•</span>
                        <span className="text-gray-300 font-semibold text-sm">
                          {match.metadata.map}
                        </span>
                      </>
                    ) : (
                      <>
                        <span
                          className={`font-bold text-sm ${
                            won ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {won ? "VICTORY" : "DEFEAT"}
                        </span>
                        <span className="text-gray-400 text-xs">•</span>
                        <span className="text-gray-300 font-semibold text-sm">
                          {match.metadata.map}
                        </span>
                        <span className="text-gray-400 text-xs">•</span>
                        <span className="text-gray-400 text-xs">
                          {teamScore} - {enemyScore}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={`val-mode-badge ${getModeColor(match.metadata.mode)}`}>
                      {formatModeName(match.metadata.mode)}
                    </span>
                    <span>{player.character}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="val-match-stats flex items-center gap-4 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-0.5">K/D/A</div>
                    <div className="font-semibold tabular-nums text-sm">
                      {player.stats.kills}/{player.stats.deaths}/
                      {player.stats.assists}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-0.5">K/D</div>
                    <div className="font-semibold tabular-nums text-sm">{kd}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-0.5">ACS</div>
                    <div className="font-semibold tabular-nums text-sm">
                      {player.stats.score}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-0.5">HS%</div>
                    <div className="font-semibold tabular-nums text-sm">{hsPercentage}%</div>
                  </div>
                </div>

                {/* Expand indicator */}
                <div className={`val-expand-icon ${isExpanded ? 'val-expand-open' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Expanded Match Detail */}
              {isExpanded && (
                <MatchDetail match={match} playerPuuid={playerPuuid} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
