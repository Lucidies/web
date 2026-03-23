'use client';

import { TwitterTweet } from '@/lib/types';
import { ExternalLink } from 'lucide-react';

interface TwitterRecentPostsProps {
  tweets: TwitterTweet[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ', ' + date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getProxyUrl(originalUrl: string): string {
  return `/api/twitter/video?url=${encodeURIComponent(originalUrl)}`;
}

function VideoPlayer({ url, thumbnailUrl }: { url: string; thumbnailUrl?: string }) {
  const proxyVideoUrl = getProxyUrl(url);
  const proxyPosterUrl = thumbnailUrl ? getProxyUrl(thumbnailUrl) : undefined;

  return (
    <video
      src={proxyVideoUrl}
      poster={proxyPosterUrl}
      className="w-full max-h-[400px] object-contain bg-black"
      controls
      preload="metadata"
      playsInline
    />
  );
}

function TweetCard({ tweet }: { tweet: TwitterTweet }) {
  const tweetUrl = tweet.url || `https://x.com/${tweet.author.screen_name}/status/${tweet.id}`;

  return (
    <div className="bento-card !p-4 overflow-hidden">
      {/* Header: Avatar + Name/Handle + Date + External Link */}
      <div className="flex items-start gap-3">
        <a
          href={`https://x.com/${tweet.author.screen_name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <img
            src={tweet.author.avatar_url}
            alt={tweet.author.name}
            className="w-10 h-10 rounded-full bg-[#333639]"
          />
        </a>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <a
                href={`https://x.com/${tweet.author.screen_name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-[#e7e9ea] hover:underline"
              >
                {tweet.author.name}
              </a>
              <span className="text-sm text-[#71767b] ml-1.5">
                @{tweet.author.screen_name}
              </span>
            </div>
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#71767b] hover:text-[#1d9bf0] transition-colors shrink-0 ml-2"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-xs text-[#71767b] mt-0.5">{formatDate(tweet.created_at)}</p>
        </div>
      </div>

      {/* Tweet Text */}
      <p className="text-sm text-[#e7e9ea] mt-3 whitespace-pre-wrap leading-relaxed break-words">
        {tweet.text}
      </p>

      {/* Media */}
      {tweet.media && tweet.media.length > 0 && (
        <div className="mt-3 rounded-xl overflow-hidden border border-[#2f3336]">
          {tweet.media.map((media, idx) => (
            <div key={idx} className="relative">
              {media.type === 'photo' ? (
                <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={media.url}
                    alt="Tweet media"
                    className="w-full max-h-[400px] object-cover"
                    loading="lazy"
                  />
                </a>
              ) : (
                <VideoPlayer
                  url={media.url}
                  thumbnailUrl={media.thumbnail_url}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TwitterRecentPosts({ tweets }: TwitterRecentPostsProps) {
  if (tweets.length === 0) {
    return (
      <div className="col-span-4">
        <div className="bento-card flex items-center justify-center min-h-[120px]">
          <p className="text-[#71767b] text-sm">This user hasn&apos;t posted yet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {tweets.map((tweet) => (
        <div key={tweet.id} className="col-span-4">
          <TweetCard tweet={tweet} />
        </div>
      ))}
    </>
  );
}
