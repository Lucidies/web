'use client';

import { useState, useCallback } from 'react';
import { useOsu } from '@/hooks/useOsu';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SearchModal, SearchButton } from '@/components/ui/SearchModal';
import { OsuProfileCard } from '@/components/osu/OsuProfileCard';
import { OsuRecentPlays } from '@/components/osu/OsuRecentPlays';
import { OsuTopPlays } from '@/components/osu/OsuTopPlays';
import { Search, X } from 'lucide-react';

function OsuIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 18.6a6.6 6.6 0 1 1 0-13.2 6.6 6.6 0 0 1 0 13.2z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function OsuPage() {
  const [searchUsername, setSearchUsername] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading, error, errorCode, retryAfter, isStale, isSearching, retry } = useOsu(searchUsername);

  const isRateLimited =
    errorCode === 'RATE_LIMITED' || error?.includes('Rate limited') || error?.includes('rate limit');

  const handleSearch = useCallback((query: string) => {
    setSearchUsername(query);
    setIsModalOpen(false);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchUsername(null);
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
            accentColor="#e84393"
            label="Search Profile"
          />
        </div>

        <div className="bento-card col-span-4 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">osu!</h1>
            <p className={isRateLimited ? 'text-yellow-400' : 'text-red-400'}>
              {isRateLimited ? '⏳ ' : ''}
              {error || 'Failed to load data'}
            </p>
            {isRateLimited && retryAfter && (
              <p className="text-xs text-gray-500 mt-1">Try again in about {retryAfter} seconds.</p>
            )}
            <button
              onClick={retry}
              className="mt-4 px-4 py-2 text-sm rounded-lg transition-colors"
              style={{
                background: 'rgba(232, 67, 147, 0.15)',
                border: '1px solid rgba(232, 67, 147, 0.3)',
                color: '#e84393',
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
          title="Search osu! Profile"
          placeholder="Enter osu! username (e.g., mrekk)"
          icon={<OsuIcon size={20} />}
          accentColor="#e84393"
          helpTitle="How to find your osu! username:"
          helpItems={[
            'Open osu! or visit osu.ppy.sh',
            'Your username is shown on your profile',
          ]}
          isLoading={isSearching}
        />
      </main>
    );
  }

  const { user, recentScores, bestScores } = data;

  return (
    <main className="bento-container">
      {/* Search Bar */}
      <div className="col-span-4 flex items-center justify-end gap-2">
        {searchUsername && (
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
          accentColor="#e84393"
          label="Search Profile"
        />
      </div>

      {/* Searched user banner */}
      {searchUsername && (
        <div className="search-active-banner col-span-4">
          <div className="search-active-banner-info">
            <Search size={14} style={{ color: '#e84393' }} />
            <span>Viewing profile of <strong>{user.username}</strong></span>
          </div>
        </div>
      )}

      {error && isStale && (
        <div className="bento-card col-span-4 !p-3 border border-amber-400/30 bg-amber-500/10">
          <p className="text-xs text-amber-200">
            Live data could not be refreshed. Showing cached stats.
            {retryAfter ? ` Retry in ~${retryAfter}s.` : ''}
          </p>
        </div>
      )}

      <OsuProfileCard user={user} />
      <OsuRecentPlays scores={recentScores || []} />

      {bestScores && bestScores.length > 0 && <OsuTopPlays scores={bestScores} />}

      {/* Search Modal */}
      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSearch={handleSearch}
        title="Search osu! Profile"
        placeholder="Enter osu! username (e.g., mrekk)"
        icon={<OsuIcon size={20} />}
        accentColor="#e84393"
        helpTitle="How to find your osu! username:"
        helpItems={[
          'Open osu! or visit osu.ppy.sh',
          'Your username is shown on your profile',
        ]}
        isLoading={isSearching}
      />
    </main>
  );
}
