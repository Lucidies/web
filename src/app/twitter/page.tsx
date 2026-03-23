'use client';

import { useState, useCallback } from 'react';
import { useTwitter } from '@/hooks/useTwitter';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SearchModal, SearchButton } from '@/components/ui/SearchModal';
import { TwitterRecentPosts } from '@/components/twitter/TwitterRecentPosts';
import { X } from 'lucide-react';

function TwitterIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const TWITTER_ACCENT = '#1d9bf0';

export default function TwitterPage() {
  const [searchUsername, setSearchUsername] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading, error, errorCode, retryAfter, isStale, isSearching, retry } = useTwitter(searchUsername);

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
            accentColor={TWITTER_ACCENT}
            label="Search User"
          />
        </div>

        <div className="bento-card col-span-4 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Twitter / X</h1>
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
                background: `rgba(29, 155, 240, 0.15)`,
                border: `1px solid rgba(29, 155, 240, 0.3)`,
                color: TWITTER_ACCENT,
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
          title="Search Twitter User"
          placeholder="Enter Twitter/X username"
          icon={<TwitterIcon size={20} />}
          accentColor={TWITTER_ACCENT}
          helpTitle="How to search:"
          helpItems={[
            'Enter a Twitter/X username (without the @)',
            'Example: elonmusk',
          ]}
        />
      </main>
    );
  }

  return (
    <main className="bento-container">
      {/* Search controls */}
      <div className="col-span-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {searchUsername && (
            <button
              onClick={handleClearSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors"
              style={{
                background: 'rgba(29, 155, 240, 0.1)',
                border: '1px solid rgba(29, 155, 240, 0.2)',
                color: TWITTER_ACCENT,
              }}
            >
              <X className="w-3 h-3" />
              Back to default
            </button>
          )}
          {isStale && (
            <span className="text-xs text-yellow-500/70 flex items-center gap-1">
              ⚠ Showing cached data
            </span>
          )}
        </div>
        <SearchButton
          onClick={() => setIsModalOpen(true)}
          accentColor={TWITTER_ACCENT}
          label="Search User"
        />
      </div>

      {/* Recent Posts */}
      <TwitterRecentPosts tweets={data.tweets} />

      {/* Search Modal */}
      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSearch={handleSearch}
        title="Search Twitter User"
        placeholder="Enter Twitter/X username"
        icon={<TwitterIcon size={20} />}
        accentColor={TWITTER_ACCENT}
        helpTitle="How to search:"
        helpItems={[
          'Enter a Twitter/X username (without the @)',
          'Example: elonmusk',
        ]}
      />
    </main>
  );
}
