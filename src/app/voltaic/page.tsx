'use client';

import { useState, useCallback } from 'react';
import { useKovaaks } from '@/hooks/useKovaaks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SearchModal, SearchButton } from '@/components/ui/SearchModal';
import { KovaaksProfileCard } from '@/components/kovaaks/KovaaksProfileCard';
import { KovaaksBenchmarks } from '@/components/kovaaks/KovaaksBenchmarks';
import { Search, X } from 'lucide-react';

function VoltaicIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M40.9,15.8H16.6c-0.3,0-0.5,0.1-0.6,0.3l-5.3,9.2c-0.1,0.2-0.1,0.5,0,0.7L39,75c0.3,0.5,0.9,0.5,1.2,0l23.2-40.2c0.3-0.5-0.1-1-0.6-1h-9c-0.5,0-0.9-0.6-0.6-1.1l3.9-6.8c0.1-0.2,0.4-0.3,0.6-0.3h19.2c0.5,0,0.9,0.6,0.6,1L44.3,84.2l0,0h11c0.3,0,0.5-0.1,0.6-0.3L89.3,26c0.1-0.2,0.1-0.5,0-0.7L84,16.1c-0.1-0.2-0.4-0.3-0.6-0.3H51.9c-0.3,0-0.5,0.1-0.6,0.4L37.6,39.9c-0.3,0.5,0.1,1,0.6,1h9.1c0.5,0,0.9,0.6,0.6,1l-7.7,13.3c-0.3,0.5-0.9,0.5-1.2,0L22.5,26.7c-0.3-0.5,0.1-1,0.6-1H36c0.3,0,0.5-0.1,0.6-0.4l4.9-8.5C41.8,16.3,41.4,15.8,40.9,15.8z"/>
    </svg>
  );
}

export default function VoltaicPage() {
  const [searchUsername, setSearchUsername] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading, error, errorCode, retryAfter, isStale, isSearching, retry } = useKovaaks(searchUsername);

  const isRateLimited =
    errorCode === 'RATE_LIMITED' || error?.includes('Rate limited') || error?.includes('rate limit');

  const handleSearch = useCallback((query: string) => {
    setSearchUsername(query.trim());
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
            accentColor="#f97316"
            label="Search Profile"
          />
        </div>

        <div className="bento-card col-span-4 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Voltaic</h1>
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
                background: 'rgba(249, 115, 22, 0.15)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                color: '#f97316',
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
          title="Search Voltaic Profile"
          subtitle="Displays the Voltaic S5 benchmarks"
          placeholder="Enter Steam ID or username"
          icon={<VoltaicIcon size={20} />}
          accentColor="#f97316"
          helpTitle="How to search:"
          helpItems={[
            'Enter your KovaaK\'s in-game username',
            'Or use your Steam ID (numeric, 17 digits)',
            'Scores are pulled from Voltaic Season 5 benchmarks',
          ]}
          isLoading={isSearching}
        />
      </main>
    );
  }

  const { profile, benchmarks, allBenchmarks, vtEnergy, bestVtEnergy } = data;

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
          accentColor="#f97316"
          label="Search Profile"
        />
      </div>

      {/* Searched user banner */}
      {searchUsername && (
        <div className="search-active-banner col-span-4">
          <div className="search-active-banner-info">
            <Search size={14} style={{ color: '#f97316' }} />
            <span>Viewing profile of <strong>{profile.webAppUsername}</strong></span>
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

      <KovaaksProfileCard profile={profile} benchmarks={benchmarks} allBenchmarks={allBenchmarks} bestVtEnergy={bestVtEnergy} />
      <KovaaksBenchmarks benchmarks={benchmarks} allBenchmarks={allBenchmarks} vtEnergy={vtEnergy} />

      {/* Search Modal */}
      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSearch={handleSearch}
        title="Search Voltaic Profile"
        subtitle="Displays the Voltaic S5 benchmarks"
        placeholder="Enter Steam ID or username"
        icon={<VoltaicIcon size={20} />}
        accentColor="#f97316"
        helpTitle="How to search:"
        helpItems={[
          'Enter your KovaaK\'s in-game username',
          'Or use your Steam ID (numeric, 17 digits)',
          'Scores are pulled from Voltaic Season 5 benchmarks',
        ]}
        isLoading={isSearching}
      />
    </main>
  );
}