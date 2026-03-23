'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanyard } from '@/hooks/useLanyard';
import { useDiscordUser } from '@/hooks/useDiscordUser';
import { STATUS_COLORS } from '@/lib/constants';
import { BentoCard } from '@/components/ui/BentoCard';
import { Monitor, Smartphone, Globe, Github, Twitter } from 'lucide-react';
// parseBadges is fallback-only and may be removed once proxy always supplies badges.
import { parseBadges } from '@/lib/parseBadges';

const DISCORD_CDN = 'https://cdn.discordapp.com';
const DISCORD_PROXY_API = 'https://camilo404.azurewebsites.net/v1';

export function ProfileCard() {
  const { data, isLoading, error } = useLanyard();
  const { data: userData } = useDiscordUser();

  const avatarHash = data?.discord_user?.avatar;
  const userId = data?.discord_user?.id;
  const avatarUrl = userId
    ? `${DISCORD_PROXY_API}/avatar/${encodeURIComponent(userId)}`
    : `${DISCORD_CDN}/embed/avatars/${userId ? Number(BigInt(userId) >> 22n) % 6 : 0}.png`;



  const avatarDecorationUrl = data?.discord_user?.avatar_decoration_data
    ? `https://cdn.discordapp.com/avatar-decoration-presets/${data.discord_user.avatar_decoration_data.asset}.png?size=96`
    : null;

  const statusColor = data?.discord_status
    ? STATUS_COLORS[data.discord_status]
    : STATUS_COLORS.offline;

  const displayName = data?.discord_user?.display_name || data?.discord_user?.global_name || 'june';
  const username = data?.discord_user?.username || 'ermjune';

  // Get pronouns from user profile
  const pronouns = userData?.user_profile?.pronouns || '';

  // Get active platforms
  const activePlatforms = [];
  if (data?.active_on_discord_desktop) activePlatforms.push('desktop');
  if (data?.active_on_discord_mobile) activePlatforms.push('mobile');
  if (data?.active_on_discord_web) activePlatforms.push('web');

  // Get clan tag and badge from userData (preferred) or fallback to Lanyard data
  const clanTag = userData?.user?.clan?.tag || data?.discord_user?.primary_guild?.tag;
  const clanBadge = userData?.user?.clan?.badge || data?.discord_user?.primary_guild?.badge;
  const clanGuildId = userData?.user?.clan?.identity_guild_id || data?.discord_user?.primary_guild?.identity_guild_id;
  const clanBadgeUrl = clanBadge && clanGuildId
    ? `https://cdn.discordapp.com/clan-badges/${clanGuildId}/${clanBadge}.png?size=32`
    : null;

  // Badge tooltip state (click to show)
  const [activeBadgeId, setActiveBadgeId] = useState<string | null>(null);
  const badgeTooltipRef = useRef<HTMLDivElement>(null);

  // Clan tooltip state
  const [showClanTooltip, setShowClanTooltip] = useState(false);
  const [guildData, setGuildData] = useState<{ name: string; presence_count: number; member_count: number } | null>(null);
  const [guildLoading, setGuildLoading] = useState(false);
  const clanTooltipRef = useRef<HTMLDivElement>(null);

  const fetchClanData = useCallback(async () => {
    if (!clanGuildId || guildData || guildLoading) return;

    setGuildLoading(true);
    try {
      const response = await fetch(`/api/discord-guild?id=${clanGuildId}`);
      if (!response.ok) return;
      const payload = await response.json();
      if (payload) setGuildData(payload);
    } catch {
      // Ignore and keep tooltip minimal.
    } finally {
      setGuildLoading(false);
    }
  }, [clanGuildId, guildData, guildLoading]);

  const handleClanToggle = useCallback(() => {
    const shouldOpen = !showClanTooltip;
    setShowClanTooltip(shouldOpen);
    if (shouldOpen) {
      void fetchClanData();
    }
  }, [showClanTooltip, fetchClanData]);

  // Close tooltips on outside click
  useEffect(() => {
    if (!showClanTooltip && !activeBadgeId) return;
    const handleClick = (e: MouseEvent) => {
      if (showClanTooltip && clanTooltipRef.current && !clanTooltipRef.current.contains(e.target as Node)) {
        setShowClanTooltip(false);
      }
      if (activeBadgeId && badgeTooltipRef.current && !badgeTooltipRef.current.contains(e.target as Node)) {
        setActiveBadgeId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showClanTooltip, activeBadgeId]);

  // Use profile badges from the proxy user API (camilo404) as the source of truth.
  // Keep Lanyard decode as fallback for any public_flags not yet covered by the proxy.
  const profileBadges = (userData?.badges || []).map((badge) => ({
    id: badge.id,
    description: badge.description,
    icon: badge.icon,
  }));

  const lanyardBadges = profileBadges.length === 0 ? parseBadges(
    data?.discord_user?.public_flags,
    data?.discord_user?.premium_type
  ) : [];

  const mergedBadgeMap = new Map<string, { id: string; description: string; icon: string }>();
  for (const badge of [...profileBadges, ...lanyardBadges]) {
    if (!mergedBadgeMap.has(badge.id)) {
      mergedBadgeMap.set(badge.id, badge);
    }
  }

  const badges = Array.from(mergedBadgeMap.values());

  // Get member since date
  const premiumSince = userData?.premium_since;
  const premiumGuildSince = userData?.premium_guild_since;

  // Helper to get badge tooltip info (description + date for Nitro/Booster)
  const getBadgeTooltip = (badge: { id: string; description: string }) => {
    const lines: string[] = [badge.description];

    if (badge.id.startsWith('premium') && premiumSince) {
      const since = new Date(premiumSince);
      const now = new Date();
      const diffMs = now.getTime() - since.getTime();
      const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
      const months = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
      const dateStr = since.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      let duration = '';
      if (years > 0) duration += `${years} year${years !== 1 ? 's' : ''}`;
      if (months > 0) duration += `${duration ? ', ' : ''}${months} month${months !== 1 ? 's' : ''}`;
      lines.push(`Subscriber since ${dateStr}${duration ? ` (${duration})` : ''}`);
    }

    if (badge.id.startsWith('guild_booster') && premiumGuildSince) {
      const since = new Date(premiumGuildSince);
      const now = new Date();
      const diffMs = now.getTime() - since.getTime();
      const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
      const months = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
      const dateStr = since.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      let duration = '';
      if (years > 0) duration += `${years} year${years !== 1 ? 's' : ''}`;
      if (months > 0) duration += `${duration ? ', ' : ''}${months} month${months !== 1 ? 's' : ''}`;
      lines.push(`Boosting since ${dateStr}${duration ? ` (${duration})` : ''}`);
    }

    return lines;
  };

  if (isLoading) {
    return (
      <BentoCard colSpan={4} className="profile-card-merged">
        <div className="pcm-loading-shell" aria-label="Loading profile" aria-busy="true">
          <div className="pcm-loading-header">
            <div className="pcm-loading-avatar pcm-loading-shimmer" />
            <div className="pcm-loading-head-meta">
              <div className="pcm-loading-line pcm-loading-line-lg pcm-loading-shimmer" />
              <div className="pcm-loading-line pcm-loading-line-md pcm-loading-shimmer" />
              <div className="pcm-loading-badges">
                <span className="pcm-loading-badge pcm-loading-shimmer" />
                <span className="pcm-loading-badge pcm-loading-shimmer" />
                <span className="pcm-loading-badge pcm-loading-shimmer" />
              </div>
            </div>
          </div>

          <div className="pcm-loading-message-list">
            <div className="pcm-loading-message-row">
              <span className="pcm-loading-message-dot pcm-loading-shimmer" />
              <div className="pcm-loading-message-lines">
                <div className="pcm-loading-line pcm-loading-line-chat pcm-loading-shimmer" />
                <div className="pcm-loading-line pcm-loading-line-chat-short pcm-loading-shimmer" />
              </div>
            </div>
            <div className="pcm-loading-message-row">
              <span className="pcm-loading-message-dot pcm-loading-shimmer" />
              <div className="pcm-loading-message-lines">
                <div className="pcm-loading-line pcm-loading-line-chat pcm-loading-shimmer" />
                <div className="pcm-loading-line pcm-loading-line-chat-mid pcm-loading-shimmer" />
              </div>
            </div>
          </div>

          <div className="pcm-loading-footer">
            <span className="pcm-loading-icon pcm-loading-shimmer" />
            <span className="pcm-loading-icon pcm-loading-shimmer" />
            <span className="pcm-loading-icon pcm-loading-shimmer" />
            <span className="pcm-loading-icon pcm-loading-shimmer" />
          </div>
        </div>
      </BentoCard>
    );
  }

  if (error) {
    return (
      <BentoCard colSpan={4} className="profile-card-merged">
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-red-400">Failed to load profile</div>
        </div>
      </BentoCard>
    );
  }

  return (
    <BentoCard colSpan={4} className="profile-card-merged">
      {/* Top Section: Avatar + Info */}
      <div className="pcm-header">
        {/* Avatar */}
          <div className="pcm-avatar-wrap">
          <div className="pcm-avatar-container">
            <Image
              src={avatarUrl}
              alt="Avatar"
              className="pcm-avatar-img"
              width={96}
              height={96}
              unoptimized
            />
            {avatarDecorationUrl && (
              <Image
                src={avatarDecorationUrl}
                alt="Avatar Decoration"
                className="pcm-avatar-decoration"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                width={110}
                height={110}
                unoptimized
              />
            )}
            <div
              className="pcm-status-dot"
              style={{ backgroundColor: statusColor }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="pcm-info">
          {/* Name + Clan */}
          <div className="pcm-name-row">
            <h1 className="pcm-display-name">{displayName}</h1>
            {clanTag && (
              <div className="clan-tag-wrapper" ref={clanTooltipRef}>
                <button
                  className="clan-tag-v2"
                  onClick={handleClanToggle}
                  type="button"
                >
                  {clanBadgeUrl && (
                    <Image
                      src={clanBadgeUrl}
                      alt="Clan Badge"
                      className="clan-badge-icon-v2"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      width={20}
                      height={20}
                      unoptimized
                    />
                  )}
                  <span>{clanTag}</span>
                </button>

                {/* Clan Tooltip Popup */}
                {showClanTooltip && (
                  <div className="clan-tooltip-popup">
                    {clanGuildId && (
                      <div className="clan-tooltip-banner">
                        <Image
                          src={`https://cdn.discordapp.com/discovery-splashes/${clanGuildId}/banner.png?size=480`}
                          alt=""
                          className="clan-tooltip-banner-img"
                          onError={(e) => {
                            const parent = e.currentTarget.parentElement;
                            if (parent) parent.style.display = 'none';
                          }}
                          width={480}
                          height={180}
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="clan-tooltip-content">
                      <div className="clan-tooltip-name">
                        {clanBadgeUrl && (
                          <Image
                            src={clanBadgeUrl}
                            alt=""
                            className="clan-tooltip-badge"
                            width={18}
                            height={18}
                            unoptimized
                          />
                        )}
                        <span>{guildData?.name || clanTag}</span>
                      </div>
                      {guildData && (
                        <div className="clan-tooltip-stats">
                          <span className="clan-tooltip-online">
                            <span className="clan-tooltip-dot" style={{ backgroundColor: '#3ba55c' }} />
                            {guildData.presence_count.toLocaleString()} Online
                          </span>
                        </div>
                      )}
                      {guildLoading && (
                        <div className="clan-tooltip-stats">
                          <span className="text-xs text-gray-500">Loading...</span>
                        </div>
                      )}
                      <a
                        href={`https://discord.com/servers/${clanGuildId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="clan-tooltip-btn"
                      >
                        Go to Server
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description line: username + pronouns + badges */}
          <div className="pcm-meta-line">
            <span className="pcm-username">{username}</span>
            {pronouns && (
              <>
                <span className="pcm-separator">•</span>
                <span className="pcm-pronouns">{pronouns}</span>
              </>
            )}
            {badges.length > 0 && (
              <div className="profile-badges-inline">
                {badges.slice(0, 6).map((badge) => {
                  const tooltipLines = getBadgeTooltip(badge);
                  const isActive = activeBadgeId === badge.id;

                  const badgeIconUrl = (() => {
                    if (!badge.icon) return '';

                    if (badge.icon.startsWith(DISCORD_PROXY_API)) {
                      return badge.icon;
                    }

                    if (/^https?:\/\/cdn\.discordapp\.com\/badge-icons\//i.test(badge.icon)) {
                      const hash = badge.icon.replace(/^https?:\/\/cdn\.discordapp\.com\/badge-icons\//i, '').replace(/\.png$/i, '');
                      return `${DISCORD_PROXY_API}/badge/${encodeURIComponent(hash)}.png`;
                    }

                    if (/^https?:\/\//i.test(badge.icon)) {
                      return badge.icon;
                    }

                    const iconKey = badge.icon.replace(/\.png$/i, '');
                    return `${DISCORD_PROXY_API}/badge/${encodeURIComponent(iconKey)}.png`;
                  })();

                  return (
                    <div
                      key={badge.id}
                      className="badge-tooltip-wrapper"
                      ref={isActive ? badgeTooltipRef : undefined}
                    >
                      <Image
                        src={badgeIconUrl}
                        alt={badge.description}
                        className="profile-badge-icon-v2"
                        onClick={() => setActiveBadgeId(isActive ? null : badge.id)}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        width={20}
                        height={20}
                        unoptimized
                      />
                      {isActive && (
                        <div className="badge-tooltip">
                          {tooltipLines.map((line, i) => (
                            <span key={i} className={i === 0 ? 'badge-tooltip-title' : 'badge-tooltip-detail'}>
                              {line}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bio */}
          {userData?.user?.bio && (
            <p className="pcm-bio">{userData.user.bio}</p>
          )}

          {/* Platform Indicators */}
          {activePlatforms.length > 0 && (
            <div className="pcm-platforms">
              {activePlatforms.includes('desktop') && (
                <div className="platform-icon-v2" title="Desktop">
                  <Monitor className="w-3.5 h-3.5" />
                </div>
              )}
              {activePlatforms.includes('mobile') && (
                <div className="platform-icon-v2" title="Mobile">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
              )}
              {activePlatforms.includes('web') && (
                <div className="platform-icon-v2" title="Web">
                  <Globe className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          )}

        </div>
      </div>


      {/* Connections Row */}
      <div className="pcm-connections">
        <a
          href="https://github.com/Lucidies"
          target="_blank"
          rel="noopener noreferrer"
          className="pcm-conn-btn"
          title="GitHub"
        >
          <Github className="w-5 h-5" />
        </a>
        <a
          href="https://x.com/ripyrskinofff"
          target="_blank"
          rel="noopener noreferrer"
          className="pcm-conn-btn"
          title="Twitter"
        >
          <Twitter className="w-5 h-5" />
        </a>
        <a
          href="https://osu.ppy.sh/users/26029989"
          target="_blank"
          rel="noopener noreferrer"
          className="pcm-conn-btn"
          title="osu!"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.698 10.362c-.1855-.2184-.4189-.3905-.7002-.5162-.2813-.1257-.6104-.1885-.9874-.1885s-.7046.0628-.9829.1885-.5088.2978-.6912.5162c-.1827.2185-.3203.4773-.413.7765-.0928.2993-.1391.6194-.1391.9605 0 .3412.0463.6584.1391.9516.0927.2933.2303.5491.413.7675.1824.2185.4129.3891.6912.5116.2783.1226.6059.1841.9829.1841s.7061-.0615.9875-.1841c.2813-.1226.5146-.2931.7002-.5116.1855-.2184.3231-.4742.413-.7675.0897-.2931.1346-.6104.1346-.9516 0-.3411-.0449-.6612-.1346-.9605-.0899-.2992-.2276-.558-.4131-.7765zm-.965 2.8096c-.1467.2484-.3875.3725-.7227.3725-.3291 0-.567-.1241-.7136-.3725-.1467-.2483-.2199-.6059-.2199-1.0727s.0732-.8243.2199-1.0727c.1466-.2482.3844-.3725.7136-.3725.3352 0 .5759.1243.7227.3725.1466.2484.2199.6059.2199 1.0727.0001.4668-.0733.8245-.2199 1.0727zm11.8894-.8303-.0898-4.3896a4.5409 4.5409 0 0 1 .6912-.0539c.2334 0 .4668.0179.7002.0539l-.0898 4.3896c-.2096.0359-.41.0538-.6015.0538a3.4957 3.4957 0 0 1-.6103-.0538zm1.3196 1.4003c0 .2215-.0179.443-.0538.6643a4.2055 4.2055 0 0 1-.6553.0538 4.1414 4.1414 0 0 1-.6642-.0538 4.0882 4.0882 0 0 1-.0539-.6553c0-.2154.018-.4367.0539-.6643a4.0876 4.0876 0 0 1 .6552-.0538c.2155 0 .4368.018.6643.0538.0359.2276.0538.446.0538.6553zm-3.2226-4.0305c.2095 0 .422.018.6373.0539v4.4614c-.1916.0659-.4443.1302-.7585.193-.3141.0629-.6418.0943-.9829.0943-.3052 0-.5985-.024-.8798-.0718-.2813-.0479-.5282-.1495-.7405-.3052-.2125-.1555-.3815-.3829-.5072-.6823-.1257-.2991-.1885-.697-.1885-1.1938V9.765a3.8725 3.8725 0 0 1 .6373-.0539c.2094 0 .4219.018.6373.0539v2.4596c0 .2455.0194.4474.0584.6059.0388.1586.0988.2843.1795.377a.6606.6606 0 0 0 .3007.1974c.1197.0391.2603.0584.4219.0584.2214 0 .407-.0209.5566-.0628V9.765a3.8218 3.8218 0 0 1 .6284-.0539zm-4.3625 2.6841c.0538.1497.0808.3321.0808.5476 0 .2215-.0464.428-.1392.6194-.0928.1916-.2274.3577-.4039.4982-.1766.1407-.3905.2514-.6418.3322-.2514.0808-.5356.1212-.8528.1212a5.2984 5.2984 0 0 1-.395-.0135 3.1226 3.1226 0 0 1-.3456-.0448 4.0482 4.0482 0 0 1-.3277-.0763 3.9336 3.9336 0 0 1-.35-.1166 2.5768 2.5768 0 0 1 .0852-.4893 3.0737 3.0737 0 0 1 .1751-.4802c.1975.0779.3844.1362.561.1751.1765.039.3605.0584.5521.0584.0838 0 .175-.0075.2738-.0225a.9945.9945 0 0 0 .2737-.0808.6467.6467 0 0 0 .2109-.1526c.0569-.0628.0853-.145.0853-.2469 0-.1436-.0434-.2469-.1302-.3097-.0868-.0628-.208-.1181-.3636-.1661l-.5565-.1616c-.3352-.0956-.5969-.2379-.7855-.4263-.1885-.1886-.2827-.4713-.2827-.8484 0-.4547.163-.8108.4892-1.0682.3261-.2573.7705-.386 1.333-.386.2334 0 .4638.0211.6913.0629.2273.0419.4578.1048.6912.1885-.012.1557-.0419.3173-.0897.4847-.048.1676-.1048.3142-.1706.4398a3.58 3.58 0 0 0-.4757-.1571 2.18 2.18 0 0 0-.5477-.0673c-.2034 0-.3621.0314-.4758.0943-.1137.0629-.1705.1631-.1705.3007 0 .1317.0403.2244.1211.2783.0809.0538.1959.1048.3456.1526l.5117.1526c.1675.048.3187.1063.4533.1751.1347.0688.2498.1541.3456.2558.0958.1016.1707.2272.2246.3768zM12 0C5.3726 0 0 5.3726 0 12.0001 0 18.6273 5.3726 24 12 24c6.6275 0 12-5.3727 12-11.9999C24 5.3726 18.6275 0 12 0zm0 22.8c-5.9647 0-10.8-4.8354-10.8-10.7999C1.2 6.0353 6.0353 1.2 12 1.2s10.8 4.8353 10.8 10.8001C22.8 17.9646 17.9647 22.8 12 22.8z" fill="currentColor"/>
          </svg>
        </a>
        <a
          href="https://steamcommunity.com/id/stupidmutts"
          target="_blank"
          rel="noopener noreferrer"
          className="pcm-conn-btn"
          title="Steam"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 496 512">
            <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.6-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 39.2 0 71.1-32.4 70.8-72.1l84.1-61.2c52.5.3 95.3-42.2 95.3-94.7 0-52.3-42.6-94.8-95-94.8s-95 42.5-95 94.8c0 1.1 0 2.2.1 3.3l-60.4 86.7c-11.6-.1-22.5 3-31.8 8.5L0 234.8C6.6 108.8 115.2 8 247.6 8 384.8 8 496 119 496 256zM155.7 384.3l-30.5-12.6a52.8 52.8 0 0 0 27.2 25.8c26.9 11.2 57.8-1.6 69-28.4 5.4-13 5.5-27.3.1-40.3-5.4-13-15.5-23.2-28.5-28.6-12.9-5.4-26.7-5.2-38.9-.6l31.5 13c22.1 9.1 32.5 34.7 23.4 56.8-9.1 22-34.7 32.5-56.8 23.4l3.5 1.5zm191.4-189.2c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64zm0-96.8c-18.1 0-32.8 14.7-32.8 32.8s14.7 32.8 32.8 32.8 32.8-14.7 32.8-32.8-14.7-32.8-32.8-32.8z"/>
          </svg>
        </a>
        <a
          href="https://discord.com/users/1265804735009787966"
          target="_blank"
          rel="noopener noreferrer"
          className="pcm-conn-btn"
          title="Discord"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </a>
      </div>
    </BentoCard>
  );
}