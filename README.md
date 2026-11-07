# GymCats

Gym motivator for couples. Hero landing page with a pixel-art British Shorthair Siamese cat.

## Stack

- **Next.js 15** (App Router, **TypeScript**, Tailwind CSS)
- **Vercel** — deployment
- **Supabase** — auth & database

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase URL and anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → API**.
3. Copy the **Project URL** and **publishable** key (`sb_publishable_…`; the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works) into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## Database setup

Run `supabase/migrations/20261106000000_onboarding.sql` in the Supabase SQL editor, or apply it with `supabase db push`. It creates the `profiles`, `couples` and `couple_members` tables with row-level security, the pairing functions (`create_couple`, `join_couple`) and a private `avatars` storage bucket.

Then run `supabase/migrations/20261107000000_boss_battles.sql`, `supabase/migrations/20261108000000_gym_places.sql` and `supabase/migrations/20261109000000_partner_gyms.sql`, in that order. It adds the boss battle tables (`bosses`, `user_gyms`, `gym_sessions`, `boss_battles`, `boss_attacks`) and the functions the battle screen calls (`get_battle_state`, `set_my_gym`, `gym_check_in`, `gym_heartbeat`, `gym_check_out`, `roll_spin`). Clients can read these tables but never write them directly. Every write goes through those functions, so spins and damage can't be forged.

## Boss battles

You and your partner share one boss each week (Monday to Monday, UTC). You damage it by spending spins:

- **Earning spins:** pick your gym from the gyms Google Places lists within a mile of you (you can change it once a week). Without a Places key, you name it and the app saves where you're standing. Checking in within 1 mile of it gives you 1 spin, at most once every 6 hours. You then get 1 more spin for every 10 minutes you stay. While the battle screen is open it checks your location every minute. Browsers pause location in the background, so if your phone is locked, the time since the last check counts (up to 30 minutes) when you open the app again, as long as you're still at the gym. A location check away from the gym ends the session. Sessions stop earning after 3 hours. Spins expire at the end of the week.
- **Spinning:** each spin rolls on a case-opening reel. The server picks the result; the reel only animates it.

| Rarity | Colour | Odds | Damage (share of the boss's max HP) |
|---|---|---|---|
| Common | Grey | 69.99% | up to 1% |
| Uncommon | Green | 20% | over 1%, up to 10% |
| Rare | Blue | 10% | over 10%, up to 30% |
| Legendary | Gold | 0.01% | a flat 50% |

The rules live in `src/lib/battle/rules.ts` (UI) and the boss battles migration (enforcement). Change both together.

Then run `supabase/migrations/20261110000000_workout_log.sql` for workout logging. It adds `workouts`, `workout_exercises` and `spin_wallets`, plus the `log_workout` function that saves a workout and awards spins. Clients can only read these tables; every write goes through `log_workout`.

## Log & Grow

From the hub, **Log & Grow** opens `/log`, where you log each exercise as sets of weight × reps. Each exercise is compared with your previous session of the same exercise (names are matched case-insensitively). It counts as **growth** if you:

- lift a heavier top set (even with fewer sets or reps), or
- move more total volume (reps × weight): +1 rep, +2 reps, an extra set, or an extra set at a lighter weight, or
- for bodyweight work (weight left blank), do more total reps.

Each exercise that grows earns **1 spin**. An exercise can earn at most one spin every 20 hours, so logging the same lift twice in a row doesn't pay out twice. The first time you log an exercise sets your baseline. The log screen shows your last session and one-tap "Grow it" targets (+1 rep, +2 reps, +5 lb, +1 set).

## Goal assistant (AI)

The onboarding goals step can turn a free-text description of your goals into a weekly plan. It calls a model through the Vercel AI Gateway.

- `AI_GATEWAY_API_KEY`: set in `.env.local` for local use. On Vercel, OIDC authentication is used automatically.
- `GOAL_PLAN_MODEL`: optional. Overrides the default model, `deepseek/deepseek-v4.1-flash`.

Without a gateway key, the assistant shows a "not configured" message instead of building a plan.

## Gym search (Google Places)

The battle screen lets players pick their gym from nearby gyms using the [Places API (New)](https://developers.google.com/maps/documentation/places/web-service/nearby-search) Nearby Search, limited to the `gym` and `fitness_center` types. The server repeats the search when the player saves, so the gym has to be a real gym within a mile of them.

- `GOOGLE_MAPS_API_KEY`: server-side only, never `NEXT_PUBLIC_`. In Google Cloud, enable **Places API (New)** and restrict the key to it.
- Each gym search or save is one Nearby Search Pro call (5,000 free a month, then about $32 per 1,000). Check-ins don't call Google.

Without the key, players type a gym name and the app saves where they're standing.

### 24 Hour Fitness clubs (SoCal)

`supabase/migrations/20261109000000_partner_gyms.sql` seeds `partner_gyms` with the Google place IDs of 104 24 Hour Fitness clubs in Southern California: from the Mexican border up to latitude 34.5° N (just north of Santa Clarita), and from the Arizona border west to longitude 119.5° W (Oxnard). Only place IDs are stored, since Google's terms allow keeping those but not names, addresses or coordinates.

To rebuild it (about 45 Text Search calls), adjust `REGION` in the script if needed and run:

```bash
GOOGLE_MAPS_API_KEY=... node scripts/fetch-24hf-socal.mjs
```

## Deploy to Vercel

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add the same environment variables under **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `GOOGLE_MAPS_API_KEY` (optional, for gym search)
4. Deploy — Vercel auto-detects Next.js.

Or use the Vercel CLI:

```bash
npx vercel
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npx vercel --prod
```

## Project structure

```
src/
  app/
    page.tsx          # Hero page with title card
    layout.tsx
    globals.css
    login/            # Login page and actions
    onboarding/       # Onboarding wizard route and server actions
    hub/              # Weekly boss hub (onboarded users only)
    battle/           # Battle screen and its server actions (check-in, spins)
  components/
    onboarding/       # Onboarding wizard and form steps
    boss/             # Boss placeholder and HP bar
    hub/              # Hub battle button
    battle/           # Battle screen, spin reel, gym check-in panel

    battle/           # Battle screen against the weekly boss
    log/              # Log & Grow: workout logging and its server action
  components/
    onboarding/       # Onboarding wizard and form steps
    boss/             # Boss placeholder and HP bar
    hub/              # Hub battle and Log & Grow buttons, spin badge
    battle/           # Battle screen
    log/              # Workout logger, exercise cards, results
  lib/
    supabase/         # Supabase client helpers
    onboarding/       # Onboarding validation schemas and types
    boss/             # Weekly boss roster and week helpers
    battle/           # Spin odds and damage rules, battle state types
    auth/             # Onboarded-user route guard
    workouts/         # Growth rules, schemas and workout queries
  middleware.ts       # Session refresh
scripts/
  fetch-24hf-socal.mjs  # Rebuilds the 24 Hour Fitness place ID list
supabase/
  migrations/         # Schema, RLS policies, game functions and seed data

  migrations/         # Schema, RLS policies, pairing and workout-logging functions
public/
  gymcats-hero-cat.png
```
