// API Configuration
export const DISCORD_ID = process.env.NEXT_PUBLIC_DISCORD_ID || 'x';
export const LASTFM_USERNAME = process.env.LASTFM_USERNAME || 'x';
export const LASTFM_API_KEY = process.env.LASTFM_API_KEY || 'x';
export const STEAM_ID = process.env.STEAM_ID || 'x';
export const STEAM_API_KEY = process.env.STEAM_API_KEY || 'x';
export const WEATHER_LOCATION = process.env.WEATHER_LOCATION || 'x';

// GitHub Configuration
export const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'x';

// Valorant Configuration (disabled)
// export const HENRIK_API_KEY = process.env.HENRIK_API_KEY || '';
export const VALORANT_ENABLED = false;

// osu! Configuration
export const OSU_CLIENT_ID = process.env.OSU_CLIENT_ID || 'x';
export const OSU_CLIENT_SECRET = process.env.OSU_CLIENT_SECRET || 'x';
export const OSU_USERNAME = process.env.OSU_USERNAME || 'x';
export const OSU_MODE = 'standard';

// Kovaak's Configuration
export const KOVAAKS_STEAM_ID = process.env.KOVAAKS_STEAM_ID || 'x';
export const KOVAAKS_USERNAME = process.env.KOVAAKS_USERNAME || 'x';

// Twitter/X Configuration
export const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || 'x';
export const TWITTER_USERNAME = process.env.TWITTER_USERNAME || 'x';
export const TWITTER_ENABLED = true;

// Status Colors
export const STATUS_COLORS = {
  online: '#22c55e',
  idle: '#eab308',
  dnd: '#ef4444',
  offline: '#71717a'
} as const;

// Status Names
export const STATUS_NAMES = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  offline: 'Offline'
} as const;

// Weather Codes
export const WEATHER_CODES: Record<number, string> = {
  0: 'Clear',
  1: 'Clear',
  2: 'Cloudy',
  3: 'Overcast',
  45: 'Fog',
  51: 'Drizzle',
  61: 'Rain',
  71: 'Snow',
  95: 'Storm'
};
