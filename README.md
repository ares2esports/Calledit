# CalledIt — World Cup 2026 Edition (PWA for GitHub Pages)

CalledIt is a mobile-first prediction-pool PWA. This edition: FIFA World Cup 2026 brackets. The engine is tournament-agnostic — swap `src/lib/tournament.js` (bracket structure + teams) and the results feed in `src/config.js` to run any sport or esport (e.g. an Ares2 esports edition). 100% static —
deploys to GitHub Pages with no custom backend. Works instantly in **Demo mode**
(single device, localStorage), and becomes fully multiplayer by pasting two values
from a free **Supabase** project.

## Architecture (static-host friendly)

```
GitHub Pages (static)                    External services
┌──────────────────────────┐
│ React + Vite + Tailwind  │── auth ────▶ Supabase Auth (magic link / Google)
│ HashRouter (no 404s)     │── data ────▶ Supabase Postgres + RLS
│ Service worker (PWA)     │── live ────▶ Supabase Realtime (websockets)
│ Client-side scoring      │── results ─▶ openfootball worldcup.json
└──────────────────────────┘             (free, no API key, CORS-enabled)
```

Key decisions:

- **No server anywhere.** Scoring is deterministic, so it's computed client-side from
  `picks + results`. Pick locking is enforced server-side by a Postgres trigger (can't be
  bypassed by a modified client).
- **Picks are stored by bracket side** (`{ "73": "team1" }`), not team name. A pick made
  while a slot still says "1A" automatically means *whoever wins Group A* once groups finish.
  Changing an early pick never corrupts later rounds.
- **Results feed**: [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) —
  public domain, no key, served from `raw.githubusercontent.com` (CORS `*`). Anyone in a pool
  taps "Sync" (or it's a one-line cron with Supabase). Manual entry is the fallback/override.
- **Hash routing** (`#/pool/...`) avoids GitHub Pages' missing-SPA-rewrites problem entirely.
- **Demo mode**: with no Supabase config the same UI runs on localStorage, including
  pass-and-play (multiple players on one phone).

## Quick start

```bash
npm install
npm run dev        # local dev
npm run build      # production build → dist/
```

The app runs in Demo mode out of the box. Try it: create a pool, add pass-and-play
players, fill brackets, enter a result manually, watch the leaderboard reorder.

## Going multiplayer with Supabase (~10 min, free tier)

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → paste & run `supabase/schema.sql`.
3. Authentication → Providers: Email (magic link) is on by default; optionally enable Google.
4. Authentication → URL Configuration → add your GitHub Pages URL
   (e.g. `https://you.github.io/worldcup-pool/`) as Site URL + redirect URL.
5. Project Settings → API: copy the URL and `anon` key into `src/config.js`.
6. Commit & push. Done — pools, brackets and the leaderboard are now shared and live-update.

> The anon key is safe to ship in client code; Row Level Security governs all access.

## Deploy to GitHub Pages

1. Create a repo and push this folder (the included workflow does the rest):
   ```bash
   git init && git add -A && git commit -m "World Cup pool"
   git branch -M main
   git remote add origin https://github.com/YOU/worldcup-pool.git
   git push -u origin main
   ```
2. Repo → Settings → Pages → Source: **GitHub Actions**.
3. Every push to `main` builds and deploys via `.github/workflows/deploy.yml`.
   Your app: `https://YOU.github.io/worldcup-pool/`. (`base: './'` in Vite makes the
   build path-independent — any repo name works.)

## Database schema (Supabase)

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | display names | `id (auth.users)`, `display_name` |
| `pools` | a pool | `code` (6-char invite), `owner_id`, `is_public`, `lock_at`, `scoring jsonb` |
| `pool_members` | membership | `(pool_id, user_id)` |
| `brackets` | one per member per pool | `picks jsonb`, `tiebreaker` |
| `matches` | global knockout results (nums 73–104) | `team1/2`, `score1/2`, `winner` |

RLS: everything readable; users write only their own profile/membership/bracket; a
trigger rejects bracket writes after `pools.lock_at`; any authenticated user may upsert
`matches` (data is public anyway — tighten to an admin list in V2 if desired).

## Data flow

- **Make picks** → upsert `brackets` row → Realtime pushes to every open pool page.
- **Results** → fetch openfootball JSON → parse knockout matches 73–104 → upsert `matches`
  → Realtime → every client re-scores locally → leaderboard reorders.
- **Scoring** (per pool, configurable JSON): R32 1 · R16 2 · QF 4 · SF 6 · Final 10 ·
  champion bonus 5. Tie-breaker: closest to total goals in the Final, then earliest submission.

## Screens

- **Home** — identity (name / magic link / Google), my pools, create pool, join by code.
- **Pool** — leaderboard (live), invite link (native share sheet), lock status, pass-and-play.
- **Bracket** — round tabs (R32→Final), tap a team to advance them, progress per round,
  champion summary, tie-breaker, share link. Correct/wrong picks marked ✓/✗ as results land.
- **Results** — synced feed view + manual entry/override per match.
- **Shared bracket** — read-only view from a URL-encoded snapshot (works even in demo mode).

## MVP vs V2

**MVP (this repo):** demo + Supabase modes, pools with invite codes/links, full 2026
knockout bracket (real draw, matches 73–104), side-based picks, configurable scoring,
tie-breakers, live leaderboard, results sync + manual override, shareable bracket links,
installable PWA with offline caching.

**V2 ideas:** group-stage predictions; per-pool admin allowlist for results; scheduled
results sync (Supabase Edge Function cron — still no server for you to run); pool chat;
exact-score predictions; avatars; push notifications (web push); bracket "what-if" explorer;
public pool directory.

## Notes

- The 48-team draw, the four UEFA playoff winners (Czechia, Bosnia and Herzegovina,
  Türkiye, Sweden) and both inter-confederation winners (DR Congo, Iraq) are baked into
  `src/lib/tournament.js`.
- Picks lock by default at the first Round-of-32 kickoff (June 28, 2026, 19:00 UTC).
- Offline: static assets are precached; the results feed uses network-first with a 24h
  fallback cache, so the app opens (with last-known data) without a connection.
