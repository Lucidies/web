# Plan: ProfileCard Redesign + osu! Page

## 1. ProfileCard Redesign (Discord Popup Style)

### Current vs Target

The current ProfileCard has a small banner, avatar and name side-by-side horizontally. The target design (matching the Discord profile popup) has:

- **Full-width banner** taking up the top ~40% of the card
- **Avatar overlapping** the banner/content boundary (positioned at bottom-left of banner)
- **Avatar decoration** and **status indicator** on the avatar
- **Name + clan tag** on a line below the avatar
- **Username + pronouns + badges** inline below the name
- **Member Since** info section at the bottom
- **Platform indicators** (desktop/mobile/web) shown as small icons on the avatar area

### Files to Modify

- `components/bento/ProfileCard.tsx` — complete restructure of JSX layout
- `globals.css` — update `.profile-*` CSS classes for the new layout
- Possibly `hooks/useDiscordUser.ts` — ensure we fetch `pronouns` and `premium_since` from the user profile data (already available in the `DiscordUserProfile` type)

### Data Already Available

From `useLanyard()`:
- `discord_user.avatar`, `discord_status`, `active_on_discord_desktop/mobile/web`
- `discord_user.avatar_decoration_data`, `discord_user.primary_guild`

From `useDiscordUser()`:
- `user.bio`, `user.banner`, `user_profile.pronouns`
- `badges[]`, `user.clan`, `premium_since`
- `connected_accounts`

---

## 2. osu! Page (osu!mania)

### Architecture Overview

```mermaid
flowchart TD
    A[osu/page.tsx] --> B[useOsu hook]
    B --> C[/api/osu/route.ts]
    C --> D[osu! API v2]
    D --> E[OAuth Token]
    D --> F[User Profile]
    D --> G[Recent Scores]
    D --> H[Best Scores]
    A --> I[OsuProfileCard]
    A --> J[OsuRecentPlays]
    A --> K[OsuTopPlays]
```

### osu! API v2 Setup

The osu! API v2 uses OAuth2 client credentials flow:

1. Register an OAuth application at https://osu.ppy.sh/home/account/edit#oauth
2. Get `client_id` and `client_secret`
3. Token endpoint: `POST https://osu.ppy.sh/oauth/token`
4. API base: `https://osu.ppy.sh/api/v2`

### API Endpoints Needed

| Endpoint | Purpose |
|----------|---------|
| `GET /users/{user}/mania` | User profile, rank, PP, accuracy |
| `GET /users/{user}/scores/recent?mode=mania&include_fails=1&limit=20` | Recent plays |
| `GET /users/{user}/scores/best?mode=mania&limit=10` | Top plays |

### New Files to Create

#### `api/osu/route.ts`
- Server-side API route that handles OAuth token caching
- Fetches user profile, recent scores, and best scores
- Aggregates data and returns to client
- Token refresh logic with in-memory cache

#### `lib/types.ts` (additions)
New types:
- `OsuUser` — user profile with statistics for mania mode
- `OsuScore` — individual score with beatmap info, accuracy, misses, combo, PP, mods
- `OsuBeatmap` — beatmap metadata (title, artist, difficulty, star rating)
- `OsuManiaData` — combined response type


#### `hooks/useOsu.ts`
- Fetches from `/api/osu`
- Returns `{ data, loading, error }`
- Auto-refreshes every 5 minutes (matching existing pattern)

#### `app/osu/page.tsx`
- Main page component with bento grid layout
- Loading and error states matching Valorant page pattern

#### `components/osu/OsuProfileCard.tsx`
Displays:
- Username, avatar, country flag
- Global rank and country rank
- Total PP
- Overall accuracy
- Play count, play time
- Level and progress bar
- Rank grade counts (SS, S, A)

#### `components/osu/OsuRecentPlays.tsx`
Displays a scrollable list of recent plays with:
- Beatmap background/thumbnail
- Song title and artist
- Difficulty name and star rating
- **Rank grade** (SS/S/A/B/C/D) with color coding
- **Accuracy %**
- **Misses count** (highlighted in red when > 0)
- **Max combo** vs beatmap max combo
- **PP** (if ranked)
- **Mods** used (DT, HD, etc.)
- Time ago

#### `components/osu/OsuTopPlays.tsx`
Displays best performances:
- Numbered list (1-10)
- Same info as recent plays but sorted by PP
- PP value prominently displayed
- Weight percentage shown

### Score Data Fields (osu!mania specific)

For osu!mania, the key stats per score are:
- `statistics.count_geki` (MAX/rainbow 300)
- `statistics.count_300` (300)
- `statistics.count_katu` (200)
- `statistics.count_100` (100)
- `statistics.count_50` (50)
- `statistics.count_miss` (miss)
- `accuracy` (0-1 float)
- `max_combo`
- `pp`
- `rank` (XH, X, SH, S, A, B, C, D)
- `mods[]`
- `score`

### Sidebar Update

Add to `navItems` in `components/layout/Sidebar.tsx`:
```typescript
{ href: '/osu', icon: Circle, label: 'osu!' }
```
Using `Circle` from lucide-react or a custom osu! SVG icon.

### Rank Grade Color Scheme

| Grade | Color |
|-------|-------|
| XH/X (SS) | Gold #FFD700 |
| SH/S | Yellow #FFFF00 |
| A | Green #22c55e |
| B | Blue #3b82f6 |
| C | Purple #a855f7 |
| D | Red #ef4444 |

---

## Implementation Order

1. ProfileCard redesign (CSS + component restructure)
2. osu! environment setup (API credentials, constants)
3. osu! types definition
4. osu! API route
5. useOsu hook
6. osu! page + components
7. Sidebar navigation update
8. CSS styling for osu! components
