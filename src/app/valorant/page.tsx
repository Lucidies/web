"use client";

import { useState, useCallback } from "react";
import { useValorant } from "@/hooks/useValorant";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SearchModal, SearchButton } from "@/components/ui/SearchModal";
import { MatchHistoryCard } from "@/components/valorant/MatchHistoryCard";
import { PerformanceStats } from "@/components/valorant/PerformanceStats";
import { AgentStats } from "@/components/valorant/AgentStats";
import Image from "next/image";
import { Search, X } from "lucide-react";

function ValorantIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.792 2.152a.252.252 0 0 0-.098.083c-3.384 4.23-6.769 8.46-10.15 12.69-.107.093-.025.288.119.265 2.439.003 4.877 0 7.316.001a.66.66 0 0 0 .552-.25c.774-.967 1.55-1.934 2.324-2.903a.72.72 0 0 0 .144-.49c-.002-3.077 0-6.153-.003-9.23.016-.11-.1-.206-.204-.167zM.077 2.166c-.077.038-.074.132-.076.205.002 3.074.001 6.15.001 9.225a.679.679 0 0 0 .158.463l7.64 9.55c.12.152.308.25.505.247 2.455 0 4.91.003 7.365 0 .142.02.222-.174.116-.265C10.661 15.176 5.526 8.766.4 2.35c-.08-.094-.174-.272-.322-.184z"
        fill="currentColor"
      />
    </svg>
  );
}

interface ValorantSearchParams {
  name: string;
  tag: string;
}

export default function ValorantPage() {
  const [searchParams, setSearchParams] = useState<ValorantSearchParams | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading, error, errorCode, retryAfter, isStale, isSearching, retry } = useValorant(searchParams);

  const isRateLimited =
    errorCode === "RATE_LIMITED" || error?.includes("Rate limited") || error?.includes("rate limit");

  const handleSearch = useCallback((query: string) => {
    // Parse "name#tag" format
    const hashIndex = query.lastIndexOf('#');
    if (hashIndex === -1 || hashIndex === 0 || hashIndex === query.length - 1) {
      // If no valid # separator, try treating the whole thing as a name
      // and show an error via the modal or just search with a default tag
      return;
    }

    const name = query.substring(0, hashIndex).trim();
    const tag = query.substring(hashIndex + 1).trim();

    if (name && tag) {
      setSearchParams({ name, tag });
      setIsModalOpen(false);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchParams(null);
  }, []);

  if (loading || isSearching) {
    return (
      <main className="bento-container">
        <div className="bento-card col-span-4 flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="bento-container">
        {/* Search Button even on error */}
        <div className="col-span-4 flex items-center justify-end">
          <SearchButton
            onClick={() => setIsModalOpen(true)}
            accentColor="#ff4655"
            label="Search Profile"
          />
        </div>

        <div className="bento-card col-span-4 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Valorant</h1>
            <p className={isRateLimited ? "text-yellow-400" : "text-red-400"}>
              {isRateLimited ? "⏳ " : ""}
              {error || "Failed to load data"}
            </p>
            {isRateLimited && retryAfter && (
              <p className="text-xs text-gray-500 mt-1">Try again in about {retryAfter} seconds.</p>
            )}
            <button
              onClick={retry}
              className="mt-4 px-4 py-2 text-sm rounded-lg transition-colors"
              style={{
                background: "rgba(255, 70, 85, 0.15)",
                border: "1px solid rgba(255, 70, 85, 0.3)",
                color: "#ff4655",
              }}
            >
              ↻ Retry
            </button>
          </div>
        </div>

        <SearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSearch={handleSearch}
          title="Search Valorant Profile"
          placeholder="Enter name#tag (e.g., TenZ#0505)"
          icon={<ValorantIcon size={20} />}
          accentColor="#ff4655"
          helpTitle="How to find your Riot ID:"
          helpItems={[
            'Your Riot ID is shown as Name#Tag',
            'Include the # and tag number',
            'Example: PlayerName#1234',
          ]}
          isLoading={isSearching}
        />
      </main>
    );
  }

  const { account, mmr, matches, aggregatedStats } = data;
  const currentData = mmr.current_data;

  return (
    <main className="bento-container">
      {/* Search Bar */}
      <div className="col-span-4 flex items-center justify-end gap-2">
        {searchParams && (
          <button
            onClick={handleClearSearch}
            className="search-active-banner-btn"
          >
            <X size={12} />
            Back to my profile
          </button>
        )}
        <SearchButton
          onClick={() => setIsModalOpen(true)}
          accentColor="#ff4655"
          label="Search Profile"
        />
      </div>

      {/* Searched user banner */}
      {searchParams && (
        <div className="search-active-banner col-span-4">
          <div className="search-active-banner-info">
            <Search size={14} style={{ color: '#ff4655' }} />
            <span>Viewing profile of <strong>{account.name}#{account.tag}</strong></span>
          </div>
        </div>
      )}

      {error && isStale && (
        <div className="bento-card col-span-4 !p-3 border border-amber-400/30 bg-amber-500/10">
          <p className="text-xs text-amber-200">
            Live data could not be refreshed. Showing cached stats.
            {retryAfter ? ` Retry in ~${retryAfter}s.` : ""}
          </p>
        </div>
      )}

      <div className="bento-card col-span-4 relative overflow-hidden !p-4">
        <div className="absolute inset-0 opacity-20">
          <Image src={account.card.wide} alt="Player Card Background" fill className="object-cover" />
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-800 shadow-lg border-2 border-gray-700">
            <Image src={account.card.small} alt="Player Card" fill className="object-cover" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1 drop-shadow-lg">
              {account.name}
              <span className="text-gray-400">#{account.tag}</span>
            </h1>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>Level {account.account_level}</span>
              <span>•</span>
              <span className="uppercase">{account.region}</span>
            </div>
          </div>
        </div>
      </div>

      {matches && matches.length > 0 && (
        <MatchHistoryCard matches={matches} playerPuuid={account.puuid} loading={loading} />
      )}

      <div className="bento-card col-span-2 !p-4">
        <h2 className="text-lg font-semibold mb-3">Current Rank</h2>
        <div className="flex flex-col items-center justify-center py-2">
          {currentData.images?.large && (
            <div className="relative w-24 h-24 mb-2">
              <Image src={currentData.images.large} alt={currentData.currenttierpatched} fill className="object-contain" />
            </div>
          )}
          <h3 className="text-xl font-bold mb-1">{currentData.currenttierpatched}</h3>
          <div className="text-center">
            <p className="text-gray-400 text-xs">{currentData.ranking_in_tier}/100 RR</p>
            {currentData.mmr_change_to_last_game !== 0 && currentData.images && (
              <div
                className={`flex items-center justify-center gap-1 mt-1 ${
                  currentData.mmr_change_to_last_game > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                <Image
                  src={
                    currentData.mmr_change_to_last_game > 0
                      ? currentData.images.triangle_up
                      : currentData.images.triangle_down
                  }
                  alt="Change"
                  width={10}
                  height={10}
                />
                <span className="text-xs font-medium">{Math.abs(currentData.mmr_change_to_last_game)} RR</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bento-card col-span-2 !p-4">
        <h2 className="text-lg font-semibold mb-3">Statistics</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
            <span className="text-gray-400 text-xs">MMR Rating</span>
            <span className="font-semibold text-sm">{currentData.elo}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
            <span className="text-gray-400 text-xs">Rank Progress</span>
            <span className="font-semibold text-sm">{currentData.ranking_in_tier}/100</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
            <span className="text-gray-400 text-xs">Games for Rating</span>
            <span className="font-semibold text-sm">
              {currentData.games_needed_for_rating > 0 ? currentData.games_needed_for_rating : "Rated"}
            </span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
            <span className="text-gray-400 text-xs">Last Game</span>
            <span
              className={`font-semibold text-sm ${
                currentData.mmr_change_to_last_game > 0
                  ? "text-green-400"
                  : currentData.mmr_change_to_last_game < 0
                    ? "text-red-400"
                    : "text-gray-400"
              }`}
            >
              {currentData.mmr_change_to_last_game > 0 ? "+" : ""}
              {currentData.mmr_change_to_last_game} RR
            </span>
          </div>
        </div>
      </div>

      {aggregatedStats?.performanceMetrics && <PerformanceStats stats={aggregatedStats.performanceMetrics} />}
      {aggregatedStats?.agentStats && <AgentStats agents={aggregatedStats.agentStats} />}

      {(!matches || matches.length === 0) && !aggregatedStats && (
        <div className="bento-card col-span-4">
          <div className="text-center py-8">
            <p className="text-gray-400 mb-2">No match history available</p>
            <p className="text-sm text-gray-500">Play some matches to see detailed statistics</p>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSearch={handleSearch}
        title="Search Valorant Profile"
        placeholder="Enter name#tag (e.g., TenZ#0505)"
        icon={<ValorantIcon size={20} />}
        accentColor="#ff4655"
        helpTitle="How to find your Riot ID:"
        helpItems={[
          'Your Riot ID is shown as Name#Tag',
          'Include the # and tag number',
          'Example: PlayerName#1234',
        ]}
        isLoading={isSearching}
      />
    </main>
  );
}
