'use client';

import { TwitterUser } from '@/lib/types';
import { MapPin, Link as LinkIcon, Calendar } from 'lucide-react';

interface TwitterProfileCardProps {
  user: TwitterUser;
}

function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

function formatJoinDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return `Joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  } catch {
    return '';
  }
}

export function TwitterProfileCard({ user }: TwitterProfileCardProps) {
  const profileUrl = `https://x.com/${user.username}`;

  return (
    <div className="bento-card col-span-4 overflow-hidden" style={{ padding: 0 }}>
      {/* Banner */}
      {user.banner_url ? (
        <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="block">
          <div className="w-full h-32 overflow-hidden">
            <img
              src={user.banner_url}
              alt={`${user.name}'s banner`}
              className="w-full h-full object-cover object-center"
            />
          </div>
        </a>
      ) : (
        <div className="w-full h-4" />
      )}

      {/* Profile content */}
      <div className="px-3 pb-3">
        {/* Avatar */}
        <div className={user.banner_url ? '-mt-6' : 'mt-0'}>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
            {user.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={user.name}
                className="w-12 h-12 rounded-full bg-[#1a1a1a] border-[3px] border-[#111113]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#333639] border-[3px] border-[#111113] flex items-center justify-center">
                <span className="text-lg text-[#71767b]">{user.name[0]}</span>
              </div>
            )}
          </a>
        </div>

        {/* Name + Handle */}
        <div className="mt-1">
          <div className="flex items-center gap-1">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-[#e7e9ea] hover:underline leading-tight"
            >
              {user.name}
            </a>
            {user.verified && (
              <svg className="w-3.5 h-3.5 text-[#1d9bf0] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.04 4.3l-3.7-3.7 1.41-1.41 2.29 2.29 5.29-5.29 1.41 1.41-6.7 6.7z" />
              </svg>
            )}
          </div>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#71767b] hover:underline"
          >
            @{user.username}
          </a>
        </div>

        {/* Bio */}
        {user.description && (
          <p className="text-xs text-[#e7e9ea] leading-relaxed mt-1.5">{user.description}</p>
        )}

        {/* Meta info: Location, Website, Joined */}
        {(user.location || user.website || user.created_at) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#71767b] mt-1.5">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {user.location}
              </span>
            )}
            {user.website && (
              <a
                href={user.website.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#1d9bf0] hover:underline"
              >
                <LinkIcon className="w-3 h-3 shrink-0" />
                {user.website.display_url}
              </a>
            )}
            {user.created_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 shrink-0" />
                {formatJoinDate(user.created_at)}
              </span>
            )}
          </div>
        )}

        {/* Following / Followers */}
        {user.public_metrics && (
          <div className="flex gap-3 mt-2">
            <a href={`${profileUrl}/following`} target="_blank" rel="noopener noreferrer" className="group">
              <span className="text-xs font-bold text-[#e7e9ea]">{formatCount(user.public_metrics.following_count)}</span>
              <span className="text-xs text-[#71767b] ml-1 group-hover:underline">Following</span>
            </a>
            <a href={`${profileUrl}/followers`} target="_blank" rel="noopener noreferrer" className="group">
              <span className="text-xs font-bold text-[#e7e9ea]">{formatCount(user.public_metrics.followers_count)}</span>
              <span className="text-xs text-[#71767b] ml-1 group-hover:underline">Followers</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
