export interface Badge {
  id: string;
  description: string;
  icon: string; // full URL or short key value
}

const BADGE_CDN = 'https://cdn.discordapp.com/badge-icons';

// Discord public_flags bitmask values
// https://discord.com/developers/docs/resources/user#user-object-user-flags
// Hashes mapped from Discord client resources
const FLAG_BADGES: { flag: number; id: string; description: string; icon: string }[] = [
  {
    flag: 1 << 0,
    id: 'staff',
    description: 'Discord Staff',
    icon: `${BADGE_CDN}/5e74e9b61934fc1f67c65515d1f7e60d.png`,
  },
  {
    flag: 1 << 1,
    id: 'partner',
    description: 'Partnered Server Owner',
    icon: `${BADGE_CDN}/3f9748e53446a137a052f3454e2de41e.png`,
  },
  {
    flag: 1 << 2,
    id: 'hypesquad',
    description: 'HypeSquad Events',
    icon: `${BADGE_CDN}/bf01d1073931f921909045f3a39fd264.png`,
  },
  {
    flag: 1 << 3,
    id: 'bug_hunter_level_1',
    description: 'Bug Hunter Level 1',
    icon: `${BADGE_CDN}/2717692c7dca7289b35297368a940dd0.png`,
  },
  {
    flag: 1 << 6,
    id: 'hypesquad_bravery',
    description: 'HypeSquad Bravery',
    icon: `${BADGE_CDN}/8a88d63823d8a71cd5e390baa45efa02.png`,
  },
  {
    flag: 1 << 7,
    id: 'hypesquad_brilliance',
    description: 'HypeSquad Brilliance',
    icon: `${BADGE_CDN}/011940fd013da3f7fb926e4a1cd2e618.png`,
  },
  {
    flag: 1 << 8,
    id: 'hypesquad_balance',
    description: 'HypeSquad Balance',
    icon: `${BADGE_CDN}/3aa41de486fa12454c3761e8e223442e.png`,
  },
  {
    flag: 1 << 9,
    id: 'premium_early_supporter',
    description: 'Early Supporter',
    icon: `${BADGE_CDN}/7762dc6a261a636a32f1b01b97ef4b23.png`,
  },
  {
    flag: 1 << 14,
    id: 'bug_hunter_level_2',
    description: 'Bug Hunter Level 2',
    icon: `${BADGE_CDN}/848f79194d4be5ff5f81505cbd0ce1e6.png`,
  },
  {
    flag: 1 << 16,
    id: 'verified_bot_developer',
    description: 'Early Verified Bot Developer',
    icon: `${BADGE_CDN}/6df5892e0f35b051f8b61eace34f4967.png`,
  },
  {
    flag: 1 << 17,
    id: 'certified_moderator',
    description: 'Moderator Programs Alumni',
    icon: `${BADGE_CDN}/fee1624003e2fee35cb398e125dc479b.png`,
  },
  {
    flag: 1 << 22,
    id: 'active_developer',
    description: 'Active Developer',
    icon: `${BADGE_CDN}/6f9e37f9029ff57aef81db857890005e.png`,
  },
];

// Nitro is not in public_flags — it's inferred from premium_type
// premium_type: 0 = None, 1 = Nitro Classic, 2 = Nitro, 3 = Nitro Basic
const NITRO_BADGES: Record<number, { id: string; description: string; icon: string }> = {
  1: { id: 'premium', description: 'Subscriber', icon: 'nitro' },
  2: { id: 'premium', description: 'Subscriber', icon: 'nitro' },
  3: { id: 'premium', description: 'Subscriber', icon: 'nitro' },
};

export function parseBadges(
  publicFlags: number = 0,
  premiumType?: number
): Badge[] {
  const badges: Badge[] = [];

  for (const badge of FLAG_BADGES) {
    if ((publicFlags & badge.flag) !== 0) {
      badges.push({
        id: badge.id,
        description: badge.description,
        icon: badge.icon,
      });
    }
  }

  if (premiumType && NITRO_BADGES[premiumType]) {
    const nitroBadge = NITRO_BADGES[premiumType];
    badges.push({
      id: nitroBadge.id,
      description: nitroBadge.description,
      icon: nitroBadge.icon,
    });
  }

  return badges;
}