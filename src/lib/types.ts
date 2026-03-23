// Discord/Lanyard Types
export type UnknownObject = Record<string, unknown>;

export interface LanyardData {
  kv: Record<string, string>;
  discord_user: {
    id: string;
    username: string;
    avatar: string;
    discriminator: string;
    global_name?: string;
    display_name?: string;
    bot: boolean;
    avatar_decoration_data?: {
      asset: string;
      expires_at: number | null;
      sku_id: string;
    };
    public_flags: number;
    primary_guild?: {
      badge: string;
      identity_enabled: boolean;
      identity_guild_id: string;
      tag: string;
    };
  };
  discord_status: 'online' | 'idle' | 'dnd' | 'offline';
  active_on_discord_web: boolean;
  active_on_discord_desktop: boolean;
  active_on_discord_mobile: boolean;
  active_on_discord_embedded: boolean;
  listening_to_spotify: boolean;
  spotify?: {
    song: string;
    artist: string;
    album: string;
    album_art_url: string;
    track_id: string;
    timestamps: {
      start: number;
      end: number;
    };
  };
  activities: Activity[];
}

export interface Activity {
  id: string;
  name: string;
  type: number;
  state?: string;
  details?: string;
  emoji?: {
    name: string;
    id?: string;
    animated?: boolean;
  };
  timestamps?: {
    start?: number;
    end?: number;
  };
  assets?: {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
  };
  application_id?: string;
  created_at?: number;
  flags?: number;
  session_id?: string;
  platform?: string;
}

export interface LanyardResponse {
  success: boolean;
  data: LanyardData;
}

export interface LanyardWebSocketMessage {
  op: number;
  t?: string;
  d?: LanyardData | { heartbeat_interval: number };
}

// Discord User Profile Types
export interface DiscordUserProfile {
  user: {
    id: string;
    username: string;
    global_name: string;
    avatar: string;
    avatar_decoration_data?: {
      asset: string;
      sku_id: string;
      expires_at: number | null;
    };
    collectibles: UnknownObject | null;
    discriminator: string;
    display_name_styles: UnknownObject | null;
    public_flags: number;
    primary_guild?: {
      identity_guild_id: string;
      identity_enabled: boolean;
      tag: string;
      badge: string;
    };
    clan?: {
      identity_guild_id: string;
      identity_enabled: boolean;
      tag: string;
      badge: string;
    };
    flags: number;
    banner?: string;
    banner_color?: string | null;
    accent_color?: number | null;
    bio: string;
  };
  connected_accounts: UnknownObject[];
  premium_type: number;
  premium_since?: string;
  premium_guild_since?: string;
  profile_themes_experiment_bucket: number;
  user_profile: {
    bio: string;
    accent_color: number | null;
    pronouns: string;
    profile_effect: UnknownObject | null;
    collectibles: UnknownObject[];
    banner?: string;
    theme_colors: number[];
    popout_animation_particle_type: UnknownObject | string | null;
    emoji: UnknownObject | null;
  };
  badges: Array<{
    id: string;
    description: string;
    icon: string;
    link: string;
  }>;
  guild_badges: UnknownObject[];
  widgets: UnknownObject[];
}

// Last.fm Types
export interface LastFmTrack {
  name: string;
  artist: {
    '#text': string;
    name?: string;
  };
  album?: {
    '#text': string;
  };
  image: Array<{
    size: string;
    '#text': string;
  }>;
  url: string;
  date?: {
    uts: string;
  };
  duration?: string;
  '@attr'?: {
    nowplaying?: string;
  };
}

// Steam Types
export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_2weeks?: number;
  img_icon_url: string;
  img_logo_url?: string;
}

// Weather Types
export interface WeatherData {
  current: {
    temperature_2m: number;
    weather_code: number;
  };
}

export interface GeocodingResult {
  results: Array<{
    latitude: number;
    longitude: number;
    name: string;
    country: string;
  }>;
}

// Valorant Types
export interface ValorantAccount {
  puuid: string;
  region: string;
  account_level: number;
  name: string;
  tag: string;
  card: {
    small: string;
    large: string;
    wide: string;
    id: string;
  };
  last_update: string;
}

export interface ValorantMMR {
  name: string;
  tag: string;
  current_data: {
    currenttier: number;
    currenttierpatched: string;
    ranking_in_tier: number;
    mmr_change_to_last_game: number;
    elo: number;
    games_needed_for_rating: number;
    old: boolean;
    images?: {
      small: string;
      large: string;
      triangle_down: string;
      triangle_up: string;
    };
  };
  highest_rank?: {
    old: boolean;
    tier: number;
    patched_tier: string;
    season: string;
  };
  by_season?: Record<string, unknown>;
}

// Match History Types
export interface ValorantMatchPlayer {
  puuid: string;
  name: string;
  tag: string;
  team: string;
  level: number;
  character: string;
  currenttier: number;
  currenttier_patched: string;
  player_card: string;
  player_title: string;
  party_id: string;
  session_playtime: {
    minutes: number;
    seconds: number;
    milliseconds: number;
  };
  assets: {
    card: {
      small: string;
      large: string;
      wide: string;
    };
    agent: {
      small: string;
      full: string;
      bust: string;
      killfeed: string;
    };
  };
  behaviour: {
    afk_rounds: number;
    friendly_fire: {
      incoming: number;
      outgoing: number;
    };
    rounds_in_spawn: number;
  };
  platform: {
    type: string;
    os: {
      name: string;
      version: string;
    };
  };
  ability_casts: {
    c_cast: number;
    q_cast: number;
    e_cast: number;
    x_cast: number;
  };
  stats: {
    score: number;
    kills: number;
    deaths: number;
    assists: number;
    bodyshots: number;
    headshots: number;
    legshots: number;
    damage_made: number;
    damage_received: number;
  };
  economy: {
    spent: {
      overall: number;
      average: number;
    };
    loadout_value: {
      overall: number;
      average: number;
    };
  };
  damage_made: number;
  damage_received: number;
}

export interface ValorantMatchMetadata {
  map: string;
  game_version: string;
  game_length: number;
  game_start: number;
  game_start_patched: string;
  rounds_played: number;
  mode: string;
  mode_id: string;
  queue: string;
  season_id: string;
  platform: string;
  matchid: string;
  premier_info?: {
    tournament_id: string;
    matchup_id: string;
  };
  region: string;
  cluster: string;
}

export interface ValorantMatchTeam {
  has_won: boolean;
  rounds_won: number;
  rounds_lost: number;
  roster?: {
    members: string[];
    name: string;
    tag: string;
    customization: UnknownObject;
  };
}

export interface ValorantMatch {
  metadata: ValorantMatchMetadata;
  players: {
    all_players: ValorantMatchPlayer[];
    red: ValorantMatchPlayer[];
    blue: ValorantMatchPlayer[];
  };
  observers: UnknownObject[];
  coaches: UnknownObject[];
  teams: {
    red: ValorantMatchTeam;
    blue: ValorantMatchTeam;
  };
  rounds: UnknownObject[];
  kills: UnknownObject[];
}

// MMR History Types
export interface ValorantMMRHistoryEntry {
  currenttier: number;
  currenttierpatched: string;
  ranking_in_tier: number;
  mmr_change_to_last_game: number;
  elo: number;
  date: string;
  date_raw: number;
}

export interface ValorantMMRHistory {
  name: string;
  tag: string;
  data: ValorantMMRHistoryEntry[];
}

// Aggregated Stats Types
export interface AgentStats {
  agent: string;
  games_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_kills: number;
  total_deaths: number;
  total_assists: number;
  kd_ratio: number;
  avg_combat_score: number;
  avg_kills: number;
  avg_deaths: number;
  avg_assists: number;
}

export interface PerformanceMetrics {
  overall_kd: number;
  avg_combat_score: number;
  win_rate: number;
  headshot_percentage: number;
  total_games: number;
  wins: number;
  losses: number;
  avg_kills: number;
  avg_deaths: number;
  avg_assists: number;
  avg_damage: number;
  most_played_agents: Array<{
    agent: string;
    games: number;
  }>;
  favorite_maps: Array<{
    map: string;
    games: number;
  }>;
}

export interface RecentForm {
  last_five_results: Array<{
    won: boolean;
    rr_change: number;
  }>;
  current_streak: {
    type: 'win' | 'loss';
    count: number;
  };
  avg_rr_change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ValorantData {
  account: ValorantAccount;
  mmr: ValorantMMR;
  matches?: ValorantMatch[];
  mmrHistory?: ValorantMMRHistory;
  aggregatedStats?: {
    agentStats: AgentStats[];
    performanceMetrics: PerformanceMetrics;
    recentForm: RecentForm;
  };
}

// osu! Types
export interface OsuUser {
  id: number;
  username: string;
  avatar_url: string;
  cover_url: string;
  cover?: {
    custom_url: string | null;
    url: string;
    id: string | null;
  };
  profile_colour: string | null;
  country_code: string;
  country: {
    code: string;
    name: string;
  };
  is_online: boolean;
  last_visit: string;
  join_date: string;
  playmode: string;
  statistics: OsuUserStatistics;
  rank_history?: {
    mode: string;
    data: number[];
  };
  badges?: OsuBadge[];
}

export interface OsuUserStatistics {
  global_rank: number | null;
  country_rank: number | null;
  pp: number;
  ranked_score: number;
  total_score: number;
  hit_accuracy: number;
  play_count: number;
  play_time: number;
  total_hits: number;
  maximum_combo: number;
  replays_watched_by_others: number;
  is_ranked: boolean;
  level: {
    current: number;
    progress: number;
  };
  grade_counts: {
    ss: number;
    ssh: number;
    s: number;
    sh: number;
    a: number;
  };
}

export interface OsuBadge {
  awarded_at: string;
  description: string;
  image_url: string;
  url: string;
}

export interface OsuBeatmap {
  id: number;
  beatmapset_id: number;
  difficulty_rating: number;
  mode: string;
  status: string;
  total_length: number;
  version: string;
  accuracy: number;
  ar: number;
  cs: number;
  drain: number;
  bpm: number;
  max_combo: number;
  url: string;
  beatmapset: OsuBeatmapset;
}

export interface OsuBeatmapset {
  id: number;
  title: string;
  artist: string;
  creator: string;
  covers: {
    cover: string;
    'cover@2x': string;
    card: string;
    'card@2x': string;
    list: string;
    'list@2x': string;
    slimcover: string;
    'slimcover@2x': string;
  };
  status: string;
}

export interface OsuScore {
  id: number;
  best_id: number | null;
  user_id: number;
  accuracy: number;
  mods: string[];
  score: number;
  max_combo: number;
  passed: boolean;
  perfect: boolean;
  replay: boolean;
  statistics: OsuScoreStatistics;
  rank: string;
  created_at: string;
  pp: number | null;
  beatmap: OsuBeatmap;
  beatmapset: OsuBeatmapset;
  weight?: {
    percentage: number;
    pp: number;
  };
}

export interface OsuScoreStatistics {
  count_50: number;
  count_100: number;
  count_300: number;
  count_geki: number;
  count_katu: number;
  count_miss: number;
}

export interface OsuManiaData {
  user: OsuUser;
  recentScores: OsuScore[];
  bestScores: OsuScore[];
  coverColor?: string | null;
}

// KoVaaK's Types

export interface KovaaksScoreEntry {
  score: number;
  epoch: number;
  scenarioName: string;
}

export interface KovaaksRankInfo {
  icon: string;
  name: string;
  color: string;
  frame: string;
  description: string;
  playercard_large: string;
  playercard_small: string;
}

export interface KovaaksScenarioProgress {
  score: number;
  leaderboard_rank: number;
  scenario_rank: number;
  rank_maxes: number[];
  leaderboard_id: number;
}

export interface KovaaksCategoryProgress {
  benchmark_progress: number;
  category_rank: number;
  rank_maxes: number[];
  scenarios: Record<string, KovaaksScenarioProgress>;
}

export interface KovaaksBenchmarkProgress {
  benchmark_progress: number;
  overall_rank: number;
  categories: Record<string, KovaaksCategoryProgress>;
  ranks: KovaaksRankInfo[];
}

export interface KovaaksUserProfile {
  steamId: string;
  webAppUsername: string;
  avatarUrl?: string;
  totalPlays: number;
  scenarioCount: number;
  playtimeSeconds: number;
}

export interface KovaaksSubcategoryEnergyEntry {
  subcategoryName: string;
  energy: number;
  bestScenario: string;
  score: number;
  preciseRank: number;
}

// Twitter/X Types
export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  banner_url?: string;
  description?: string;
  location?: string;
  website?: { url: string; display_url: string };
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  verified?: boolean;
  created_at?: string;
}

export interface TwitterMedia {
  type: 'photo' | 'video' | 'animated_gif';
  url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface TwitterTweetAuthor {
  name: string;
  screen_name: string;
  avatar_url: string;
}

export interface TwitterTweet {
  id: string;
  url: string;
  text: string;
  created_at: string;
  author: TwitterTweetAuthor;
  likes: number;
  replies: number;
  retweets: number;
  views?: number;
  media?: TwitterMedia[];
}

export interface TwitterData {
  user: TwitterUser;
  tweets: TwitterTweet[];
}

export interface KovaaksVtEnergyResult {
  rank: number;
  rankName: string;
  rankColor: string;
  harmonicMean: number;
  thresholds: number[];
  subcategoryEnergies: number[];
  energyDetails: Record<string, Record<string, number>>;
  subcategoryEnergiesFlat: KovaaksSubcategoryEnergyEntry[];
  expectedSubcategoryCount: number;
  difficultyName: string;
}

export interface KovaaksData {
  profile: KovaaksUserProfile;
  benchmarks: KovaaksBenchmarkProgress | null;
  allBenchmarks?: Record<string, KovaaksBenchmarkProgress | null>;
  recentScores: KovaaksScoreEntry[];
  vtEnergy?: Record<string, KovaaksVtEnergyResult | null>;
  bestVtEnergy?: KovaaksVtEnergyResult | null;
}
